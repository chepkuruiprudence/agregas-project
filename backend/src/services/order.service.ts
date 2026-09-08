// backend/src/services/orders.service.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, desc, ilike } from "drizzle-orm";
import * as schema from "../db/schema";
import { pricingService } from "./pricing.service";
import { deliveryService } from "./delivery.service";
import { notificationService } from "./notification.service";
import { retailerService } from "./retailer.service";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class OrderService {
  /**
   * Create a new order with product verification, spatial retailer matching,
   * price dynamic calculations, real-time inventory validation/deduction, delivery tracking,
   * and retailer notifications.
   */
  async createOrder(
    customerId: number,
    purchaseType: "refill" | "outright",
    brand: string,
    cylinderSize: string,
    quantity: number,
    latitude: string,
    longitude: string,
    deliveryAddress: string,
    paymentMethod: string,
    explicitRetailerId?: number
  ) {
    try {
      console.log(
        "🔍 Order Attempt: Querying products for Brand:",
        brand,
        "and Size:",
        cylinderSize
      );

      // Step 1: Find product - exact match first, then case-insensitive fallback
      let product = await db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.brand, brand),
            eq(schema.products.cylinder_size, cylinderSize)
          )
        );

      if (product.length === 0) {
        console.log("⚠️ Exact match failed. Attempting case-insensitive fallback matching...");
        product = await db
          .select()
          .from(schema.products)
          .where(
            and(
              ilike(schema.products.brand, brand),
              ilike(schema.products.cylinder_size, cylinderSize)
            )
          );
      }

      if (product.length === 0) {
        const availableProducts = await db
          .select()
          .from(schema.products)
          .limit(10);

        const availableOptions = availableProducts
          .map((p) => `${p.brand} ${p.cylinder_size}`)
          .join(", ");

        throw new AppError(
          404,
          `Product not found. No database match for Brand: "${brand}" with Cylinder Size: "${cylinderSize}". ` +
            `Available options: ${availableOptions || "None - please seed the products table"}.`
        );
      }

      console.log("✓ Product found:", product[0].brand, product[0].cylinder_size);

      // Step 2: Validate quantity
      if (quantity < 1 || quantity > 1000) {
        throw new AppError(400, "Invalid quantity. Must be between 1 and 1000 kg.");
      }

      // Step 3: Validate coordinates
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new AppError(400, "Invalid coordinates. Check latitude and longitude.");
      }

      console.log(`✓ Location validated: ${lat}, ${lng}`);

      // Step 4: Verify customer existence
      const customer = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, customerId));

      if (customer.length === 0) {
        throw new AppError(404, "Customer not found");
      }

      console.log("✓ Customer found:", customer[0].email);

      // Step 5: Match Retailer (Targeted ID or postgis nearest search fallback)
      let retailer: any;

      if (explicitRetailerId) {
        retailer = await retailerService.getRetailerById(explicitRetailerId);
        if (!retailer) {
          throw new AppError(404, "Specified retailer not found");
        }
      } else {
        const nearestResult = await retailerService.findNearestRetailerWithStock(lat, lng);
        if (!nearestResult || !nearestResult.retailer) {
          throw new AppError(404, "No retailers with available stock found near your location");
        }
        retailer = nearestResult.retailer;
      }

      console.log("✓ Retailer matched:", retailer.business_name || retailer.id);

      // Step 6: Verify retailer inventory stock availability
      const inventory = await db.query.retailInventory.findFirst({
        where: and(
          eq(schema.retailInventory.retailer_id, retailer.id),
          ilike(schema.retailInventory.brand, brand),
          ilike(schema.retailInventory.cylinder_size, cylinderSize)
        ),
      });

      if (!inventory) {
        throw new AppError(
          404,
          `Product (${brand} ${cylinderSize}) is not available in stock at ${retailer.business_name || "this retailer"}`
        );
      }

      if (inventory.quantity_available < quantity) {
        throw new AppError(
          400,
          `Insufficient stock at retailer. Available: ${inventory.quantity_available}, Requested: ${quantity}`
        );
      }

      // Step 7: Calculate price dynamically
      const supply = inventory.quantity_available;
      const demand = 500;
      const priceCalc = await pricingService.calculatePrice(
        brand,
        cylinderSize,
        quantity,
        supply,
        demand
      );

      console.log("✓ Price calculated:", priceCalc);

      // Step 8: Insert order transaction record
      const newOrder = await db
        .insert(schema.orders)
        .values({
          customer_id: customerId,
          retailer_id: retailer.id,
          status: "pending",
          quantity,
          brand,
          cylinder_size: cylinderSize,
          purchase_type: purchaseType,
          latitude: lat.toString(),
          longitude: lng.toString(),
          delivery_latitude: lat.toString(),
          delivery_longitude: lng.toString(),
          unit_price: priceCalc.basePrice.toString(),
          total_price: priceCalc.totalPrice.toString(),
          rebate_amount: priceCalc.rebateAmount.toString(),
          final_price: priceCalc.finalPrice.toString(),
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          payment_status: "pending",
        } as any)
        .returning();

      if (newOrder.length === 0) {
        throw new AppError(500, "Failed to create order");
      }

      console.log("✓ Order created:", newOrder[0].id);

      // Step 9: Deduct items from Retailer Inventory
      await retailerService.deductInventory(
        retailer.id,
        brand,
        cylinderSize,
        quantity
      );
      console.log(`📉 Deducted ${quantity} units from retailer inventory`);

      // Step 10: Initialize delivery tracking record
      await deliveryService.createDeliveryTracking(newOrder[0].id, retailer.id);
      console.log("✓ Delivery tracking created");

      // Step 11: Notify retailer
      const retailerUserId = retailer.user_id || retailer.userId;
      if (retailerUserId) {
        await notificationService.createNotification(
          retailerUserId,
          "order_update",
          `New order #${newOrder[0].id}`,
          `New order for ${quantity} unit(s) of ${brand} ${cylinderSize}`,
          newOrder[0].id
        );
        console.log("✓ Retailer notification sent");
      }

      return {
        id: newOrder[0].id,
        customerId: newOrder[0].customer_id,
        retailerId: newOrder[0].retailer_id,
        status: newOrder[0].status,
        quantity: newOrder[0].quantity,
        finalPrice: newOrder[0].final_price,
        retailerName: retailer.business_name,
        estimatedDelivery: "2-4 hours",
        createdAt: newOrder[0].created_at,
        order: newOrder[0],
      };
    } catch (error) {
      console.error("❌ Order Creation Engine Exception:", error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: number) {
    try {
      const order = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId));

      if (order.length === 0) {
        throw new AppError(404, "Order not found");
      }

      return order[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all orders for a customer with optional limit & offset pagination
   */
  async getCustomerOrders(customerId: number, limit = 20, offset = 0) {
    try {
      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.customer_id, customerId))
        .orderBy(desc(schema.orders.created_at))
        .limit(limit)
        .offset(offset);

      console.log(`✓ Retrieved ${orders.length} orders for customer ${customerId}`);
      return orders;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all orders assigned to a specific retailer
   */
  async getRetailerOrders(retailerId: number, limit = 20, offset = 0) {
    try {
      const retailerOrders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.retailer_id, retailerId))
        .orderBy(desc(schema.orders.created_at))
        .limit(limit)
        .offset(offset);

      console.log(`✓ Retrieved ${retailerOrders.length} orders for retailer ${retailerId}`);
      return retailerOrders;
    } catch (error) {
      console.error("❌ Error fetching retailer orders:", error);
      throw error;
    }
  }

  /**
   * Update order status with notification triggers
   */
  async updateOrderStatus(orderId: number, newStatus: string) {
    try {
      const validStatuses = [
        "pending",
        "confirmed",
        "processing",
        "in_delivery",
        "delivered",
        "cancelled",
      ];

      if (!validStatuses.includes(newStatus)) {
        throw new AppError(
          400,
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        );
      }

      const updated = await db
        .update(schema.orders)
        .set({
          status: newStatus as any,
          updated_at: new Date(),
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "Order not found");
      }

      const order = updated[0];
      await notificationService.createNotification(
        order.customer_id,
        "order_update",
        "Order Status Updated",
        `Your order #${orderId} status is now ${newStatus}`,
        orderId
      );

      console.log(`✓ Order #${orderId} status updated to ${newStatus}`);
      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel an order (only allowed if pending or confirmed)
   */
  async cancelOrder(orderId: number) {
    try {
      const order = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId));

      if (order.length === 0) {
        throw new AppError(404, "Order not found");
      }

      const currentOrder = order[0];
      const canBeCancelled = ["pending", "confirmed"].includes(currentOrder.status);

      if (!canBeCancelled) {
        throw new AppError(
          400,
          `Cannot cancel order with status "${currentOrder.status}". Only pending or confirmed orders can be cancelled.`
        );
      }

      const updated = await db
        .update(schema.orders)
        .set({
          status: "cancelled",
          updated_at: new Date(),
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      console.log(`✓ Order #${orderId} cancelled`);
      return updated[0];
    } catch (error) {
      throw error;
    }
  }
}

export const orderService = new OrderService();