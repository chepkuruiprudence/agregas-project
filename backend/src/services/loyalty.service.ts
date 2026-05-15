import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class LoyaltyService {
  async earnPoints(customerId: number, orderId: number, quantityKg: number) {
    try {
      // 1 point per kg
      const points = quantityKg;

      // Check for bonuses
      let bonus = 0;
      if (quantityKg >= 50) {
        bonus = 100; // Bulk order bonus
      }

      const totalPoints = points + bonus;

      const newRecord = await db
        .insert(schema.loyaltyPoints)
        .values({
          customer_id: customerId,
          points: totalPoints,
          earned_at: new Date(),
          earned_from_order_id: orderId,
        })
        .returning();

      return newRecord[0];
    } catch (error) {
      throw error;
    }
  }

  async redeemPoints(
    customerId: number,
    pointsToRedeem: number,
    orderId: number
  ) {
    try {
      // Get customer's loyalty balance
      const loyaltyRecords = await db
        .select()
        .from(schema.loyaltyPoints)
        .where(eq(schema.loyaltyPoints.customer_id, customerId));

      const totalPoints = loyaltyRecords.reduce((sum, record) => {
        const earned = record.redeemed_at ? 0 : record.points;
        return sum + earned;
      }, 0);

      if (totalPoints < pointsToRedeem) {
        throw new AppError(400, "Insufficient loyalty points");
      }

      // Redeem points (1 point = 1 KES)
      const redemptionValue = pointsToRedeem;

      // Mark as redeemed
      const updated = await db
        .update(schema.loyaltyPoints)
        .set({
          redeemed_at: new Date(),
          redeemed_for_order_id: orderId,
          redemption_value: redemptionValue.toString(),
        })
        .where(eq(schema.loyaltyPoints.customer_id, customerId))
        .returning();

      return {
        pointsRedeemed: pointsToRedeem,
        discountApplied: redemptionValue,
      };
    } catch (error) {
      throw error;
    }
  }

  async getBalance(customerId: number) {
    try {
      const records = await db
        .select()
        .from(schema.loyaltyPoints)
        .where(eq(schema.loyaltyPoints.customer_id, customerId));

      const balance = records.reduce((sum, record) => {
        if (record.redeemed_at) return sum; // Already redeemed
        return sum + record.points;
      }, 0);

      return { customerId, balance };
    } catch (error) {
      throw error;
    }
  }

  async getHistory(customerId: number) {
    try {
      const records = await db
        .select()
        .from(schema.loyaltyPoints)
        .where(eq(schema.loyaltyPoints.customer_id, customerId));

      return records;
    } catch (error) {
      throw error;
    }
  }

  async referralBonus(customerId: number) {
    try {
      const newRecord = await db
        .insert(schema.loyaltyPoints)
        .values({
          customer_id: customerId,
          points: 500,
          earned_at: new Date(),
        })
        .returning();

      return newRecord[0];
    } catch (error) {
      throw error;
    }
  }
}

export const loyaltyService = new LoyaltyService();