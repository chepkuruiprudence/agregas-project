import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../db/schema";
import { pricingService } from "./pricing.service";
import { deliveryService } from "./delivery.service";
import { notificationService } from "./notification.service";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class OrderService {
  async createOrder(
    customerId: number,
    brand: string,
    cylinderSize: string,
    quantity: number,
    deliveryAddress: string,
    paymentMethod: string
  ) {
    try {
      // Get product
      const product = await db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.brand, brand),
            eq(schema.products.cylinder_size, cylinderSize)
          )
        );

      if (product.length === 0) {
        throw new AppError(404, "Product not found");
      }

      // Calculate price (assume supply=1000, demand=500 for now - in real app, these come from live data)
      const priceCalc = await pricingService.calculatePrice(
        brand,
        cylinderSize,
        quantity,
        1000,
        500
      );

      // Geo-match retailer
      const customer = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, customerId));

      if (customer.length === 0) {
        throw new AppError(404, "Customer not found");
      }

      // For now, get first retailer with stock (in real app, use geo-matching)
      const retailers = await db
        .select()
        .from(schema.retailers)
        .where(
          and(
            eq(schema.retailers.brand, brand),
            eq(schema.retailers.is_active, true)
          )
        );

      if (retailers.length === 0) {
        throw new AppError(404, "No retailers available");
      }

      const retailer = retailers[0];

      // Create order
      const newOrder = await db
        .insert(schema.orders)
        .values({
          customer_id: customerId,
          retailer_id: retailer.id,
          product_id: product[0].id,
          status: "pending",
          quantity,
          brand,
          unit_price: priceCalc.basePrice.toString(),
          total_price: priceCalc.totalPrice.toString(),
          rebate_amount: priceCalc.rebateAmount.toString(),
          final_price: priceCalc.finalPrice.toString(),
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          payment_status: "pending",
        })
        .returning();

      // Create delivery tracking
      await deliveryService.createDeliveryTracking(newOrder[0].id, retailer.id);

      // Send notification to retailer
      await notificationService.createNotification(
        retailer.user_id,
        "order_update",
        `New order #${newOrder[0].id}`,
        `New order for ${quantity}kg of ${brand} ${cylinderSize}`,
        newOrder[0].id
      );

      return {
        id: newOrder[0].id,
        customerId: newOrder[0].customer_id,
        retailerId: newOrder[0].retailer_id,
        status: newOrder[0].status,
        quantity: newOrder[0].quantity,
        finalPrice: newOrder[0].final_price,
        retailerName: retailer.business_name,
        estimatedDelivery: "2-4 hours",
      };
    } catch (error) {
      throw error;
    }
  }

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

  async getCustomerOrders(customerId: number) {
    try {
      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.customer_id, customerId))
        .orderBy(desc(schema.orders.created_at));

      return orders;
    } catch (error) {
      throw error;
    }
  }

  async updateOrderStatus(orderId: number, newStatus: string) {
    try {
      const updated = await db
        .update(schema.orders)
        .set({ status: newStatus as any })
        .where(eq(schema.orders.id, orderId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "Order not found");
      }

      // Send notification
      const order = updated[0];
      await notificationService.createNotification(
        order.customer_id,
        "order_update",
        "Order Status Updated",
        `Your order #${orderId} status is now ${newStatus}`,
        orderId
      );

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  async cancelOrder(orderId: number) {
    try {
      const updated = await db
        .update(schema.orders)
        .set({ status: "cancelled" })
        .where(eq(schema.orders.id, orderId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "Order not found");
      }

      return updated[0];
    } catch (error) {
      throw error;
    }
  }
}

export const orderService = new OrderService();