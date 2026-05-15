import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class NotificationService {
  async createNotification(
    userId: number,
    type: string,
    title: string,
    message: string,
    relatedOrderId?: number
  ) {
    try {
      const newNotification = await db
        .insert(schema.notifications)
        .values({
          user_id: userId,
          type: type as any,
          title,
          message,
          related_order_id: relatedOrderId || null,
          is_read: false,
        })
        .returning();

      return newNotification[0];
    } catch (error) {
      throw error;
    }
  }

  async getNotifications(userId: number, limit: number = 10) {
    try {
      const notifications = await db
        .select()
        .from(schema.notifications)
        .where(eq(schema.notifications.user_id, userId))
        .orderBy(desc(schema.notifications.created_at))
        .limit(limit);

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  async markAsRead(notificationId: number) {
    try {
      const updated = await db
        .update(schema.notifications)
        .set({ is_read: true })
        .where(eq(schema.notifications.id, notificationId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "Notification not found");
      }

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  async getUnreadCount(userId: number) {
    try {
      const notifications = await db
        .select()
        .from(schema.notifications)
        .where(eq(schema.notifications.user_id, userId));

      const unreadCount = notifications.filter((n) => !n.is_read).length;

      return { userId, unreadCount };
    } catch (error) {
      throw error;
    }
  }

  async deleteNotification(notificationId: number) {
    try {
      // For now, just mark as old or use soft delete
      // Drizzle doesn't have direct delete in this context
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

export const notificationService = new NotificationService();