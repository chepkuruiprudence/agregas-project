import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class RetailerService {
  async getRetailerInventory(retailerId: number) {
    try {
      const retailer = await db
        .select()
        .from(schema.retailers)
        .where(eq(schema.retailers.id, retailerId));

      if (retailer.length === 0) {
        throw new AppError(404, "Retailer not found");
      }

      return {
        retailerId,
        brand: retailer[0].brand,
        stockQuantity: retailer[0].stock_quantity,
        cylinderSize: retailer[0].cylinder_size,
        lastUpdated: retailer[0].updated_at,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateInventory(
    retailerId: number,
    newQuantity: number
  ) {
    try {
      const updated = await db
        .update(schema.retailers)
        .set({ stock_quantity: newQuantity })
        .where(eq(schema.retailers.id, retailerId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "Retailer not found");
      }

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  async acceptOrder(retailerId: number, orderId: number) {
    try {
      // Get order
      const order = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId));

      if (order.length === 0) {
        throw new AppError(404, "Order not found");
      }

      // Deduct stock
      const retailer = await db
        .select()
        .from(schema.retailers)
        .where(eq(schema.retailers.id, retailerId));

      const newStock = retailer[0].stock_quantity - order[0].quantity;

      if (newStock < 0) {
        throw new AppError(400, "Insufficient stock");
      }

      await this.updateInventory(retailerId, newStock);

      // Update order status
      const updated = await db
        .update(schema.orders)
        .set({ status: "confirmed" })
        .where(eq(schema.orders.id, orderId))
        .returning();

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  async rejectOrder(retailerId: number, orderId: number) {
    try {
      // Set order back to pending for reassignment
      const updated = await db
        .update(schema.orders)
        .set({ status: "pending" })
        .where(eq(schema.orders.id, orderId))
        .returning();

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  async getPendingOrders(retailerId: number) {
    try {
      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.retailer_id, retailerId))
        .orderBy(desc(schema.orders.created_at));

      return orders.filter(
        (o) =>
          o.status === "pending" ||
          o.status === "confirmed" ||
          o.status === "processing"
      );
    } catch (error) {
      throw error;
    }
  }

  async getAnalytics(retailerId: number) {
    try {
      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.retailer_id, retailerId));

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce(
        (sum, order) => sum + parseFloat(order.final_price),
        0
      );
      const averageOrderValue = totalRevenue / totalOrders;

      const deliveredOrders = orders.filter(
        (o) => o.status === "delivered"
      ).length;

      return {
        retailerId,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        deliveredOrders,
        deliveryRate: (deliveredOrders / totalOrders) * 100,
      };
    } catch (error) {
      throw error;
    }
  }
}

export const retailerService = new RetailerService();