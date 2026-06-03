import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, desc, or, ilike } from "drizzle-orm";
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
  /**
   * Create a new order
   * Now with improved product matching and error handling
   */
  async createOrder(
    customerId: number,
    purchaseType: 'refill' | 'outright',
    brand: string,
    cylinderSize: string,
    quantity: number,
    latitude: string,
    longitude: string,
    deliveryAddress: string,
    paymentMethod: string
  ) {
    try {
      console.log('🔍 Order Attempt: Querying products for Brand:', brand, 'and Size:', cylinderSize);

      // Step 1: Find product - try exact match first, then case-insensitive fallback
      let product = await db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.brand, brand),
            eq(schema.products.cylinder_size, cylinderSize)
          )
        );

      // Fallback: Case-insensitive search
      if (product.length === 0) {
        console.log('⚠️ Exact match failed. Attempting case-insensitive fallback matching...');
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
        // Helpful error: show available products
        const availableProducts = await db
          .select()
          .from(schema.products)
          .limit(10);

        const availableOptions = availableProducts
          .map(p => `${p.brand} ${p.cylinder_size}`)
          .join(', ');

        throw new AppError(
          404,
          `Product not found. No database match for Brand: "${brand}" with Cylinder Size: "${cylinderSize}". ` +
          `Available options: ${availableOptions || 'None - please seed the products table'}.`
        );
      }

      console.log('✓ Product found:', product[0].brand, product[0].cylinder_size);

      // Step 2: Validate quantity
      if (quantity < 1 || quantity > 1000) {
        throw new AppError(400, 'Invalid quantity. Must be between 1 and 1000 kg.');
      }

      // Step 3: Validate location
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new AppError(400, 'Invalid coordinates. Check latitude and longitude.');
      }

      console.log(`✓ Location validated: ${lat}, ${lng}`);

      // Step 4: Get customer
      const customer = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, customerId));

      if (customer.length === 0) {
        throw new AppError(404, 'Customer not found');
      }

      console.log('✓ Customer found:', customer[0].email);

      // Step 5: Find nearest retailer with stock
      // For now, get first active retailer (in real app, use geo-distance algorithm)
      const retailers = await db
        .select()
        .from(schema.retailers)
        .where(eq(schema.retailers.is_active, true));

      if (retailers.length === 0) {
        throw new AppError(404, 'No retailers available to fulfill this order');
      }

      const retailer = retailers[0]; // Use first available retailer
      console.log('✓ Retailer matched:', retailer.business_name);

      // Step 6: Calculate price
      // Use dummy supply/demand for now (would be real-time in production)
      const supply = 1000;
      const demand = 500;
      const priceCalc = await pricingService.calculatePrice(
        brand,
        cylinderSize,
        quantity,
        supply,
        demand
      );

      console.log('✓ Price calculated:', priceCalc);

      // Step 7: Create order
      const newOrder = await db
        .insert(schema.orders)
        .values({
          customer_id: customerId,
          retailer_id: retailer.id,
          product_id: product[0].id,
          status: 'pending',
          quantity,
          brand,
          cylinder_size: cylinderSize,
          purchase_type: purchaseType,
          latitude: lat.toString(),
          longitude: lng.toString(),
          unit_price: priceCalc.basePrice.toString(),
          total_price: priceCalc.totalPrice.toString(),
          rebate_amount: priceCalc.rebateAmount.toString(),
          final_price: priceCalc.finalPrice.toString(),
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          payment_status: 'pending',
        } as any)
        .returning();

      if (newOrder.length === 0) {
        throw new AppError(500, 'Failed to create order');
      }

      console.log('✓ Order created:', newOrder[0].id);

      // Step 8: Create delivery tracking
      await deliveryService.createDeliveryTracking(newOrder[0].id, retailer.id);
      console.log('✓ Delivery tracking created');

      // Step 9: Send notification to retailer
      await notificationService.createNotification(
        retailer.user_id,
        'order_update',
        `New order #${newOrder[0].id}`,
        `New order for ${quantity}kg of ${brand} ${cylinderSize}`,
        newOrder[0].id
      );
      console.log('✓ Retailer notification sent');

      return {
        id: newOrder[0].id,
        customerId: newOrder[0].customer_id,
        retailerId: newOrder[0].retailer_id,
        status: newOrder[0].status,
        quantity: newOrder[0].quantity,
        finalPrice: newOrder[0].final_price,
        retailerName: retailer.business_name,
        estimatedDelivery: '2-4 hours',
        createdAt: newOrder[0].created_at,
      };
    } catch (error) {
      console.error('❌ Order Creation Engine Exception:', error);
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
        throw new AppError(404, 'Order not found');
      }

      return order[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all orders for a customer
   */
  async getCustomerOrders(customerId: number) {
    try {
      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.customer_id, customerId))
        .orderBy(desc(schema.orders.created_at));

      console.log(`✓ Retrieved ${orders.length} orders for customer ${customerId}`);
      return orders;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: number, newStatus: string) {
    try {
      const validStatuses = ['pending', 'confirmed', 'processing', 'in_delivery', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(newStatus)) {
        throw new AppError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const updated = await db
        .update(schema.orders)
        .set({ status: newStatus as any })
        .where(eq(schema.orders.id, orderId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, 'Order not found');
      }

      // Send notification to customer
      const order = updated[0];
      await notificationService.createNotification(
        order.customer_id,
        'order_update',
        'Order Status Updated',
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
   * Cancel an order (only if pending or confirmed)
   */
  async cancelOrder(orderId: number) {
    try {
      const order = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId));

      if (order.length === 0) {
        throw new AppError(404, 'Order not found');
      }

      const currentOrder = order[0];
      const canBeCancelled = ['pending', 'confirmed'].includes(currentOrder.status);

      if (!canBeCancelled) {
        throw new AppError(
          400,
          `Cannot cancel order with status "${currentOrder.status}". Only pending or confirmed orders can be cancelled.`
        );
      }

      const updated = await db
        .update(schema.orders)
        .set({ status: 'cancelled' })
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