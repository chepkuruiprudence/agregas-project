import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class AnalyticsService {
  async getPlatformMetrics() {
    try {
      const users = await db.select().from(schema.users);
      const orders = await db.select().from(schema.orders);
      const subscriptions = await db.select().from(schema.subscriptions);

      const totalRevenue = orders.reduce(
        (sum, order) => sum + parseFloat(order.final_price),
        0
      );

      const activeSubscriptions = subscriptions.filter(
        (s) => s.status === "active"
      ).length;

      return {
        totalUsers: users.length,
        totalOrders: orders.length,
        totalRevenue,
        activeSubscriptions,
        customers: users.filter((u) => u.role === "customer").length,
        retailers: users.filter((u) => u.role === "retailer").length,
        brands: users.filter((u) => u.role === "brand_marketer").length,
        admins: users.filter((u) => u.role === "admin").length,
      };
    } catch (error) {
      throw error;
    }
  }

  async getOrderMetrics() {
    try {
      const orders = await db.select().from(schema.orders);

      const byStatus = {
        pending: orders.filter((o) => o.status === "pending").length,
        confirmed: orders.filter((o) => o.status === "confirmed").length,
        processing: orders.filter((o) => o.status === "processing").length,
        inDelivery: orders.filter((o) => o.status === "in_delivery").length,
        delivered: orders.filter((o) => o.status === "delivered").length,
        cancelled: orders.filter((o) => o.status === "cancelled").length,
      };

      const totalRevenue = orders.reduce(
        (sum, order) => sum + parseFloat(order.final_price),
        0
      );

      const averageOrder = totalRevenue / orders.length;

      return {
        totalOrders: orders.length,
        byStatus,
        totalRevenue,
        averageOrder,
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserMetrics() {
    try {
      const users = await db.select().from(schema.users);

      return {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.is_active).length,
        inactiveUsers: users.filter((u) => !u.is_active).length,
        customers: users.filter((u) => u.role === "customer").length,
        retailers: users.filter((u) => u.role === "retailer").length,
        brands: users.filter((u) => u.role === "brand_marketer").length,
        admins: users.filter((u) => u.role === "admin").length,
      };
    } catch (error) {
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();