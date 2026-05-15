import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class CgcService {
  async earnCGC(customerId: number, orderId: number, quantityKg: number) {
    try {
      // 1 CGC per kg (in KES equivalent)
      const amount = quantityKg;

      const newRecord = await db
        .insert(schema.cgcTokens)
        .values({
          customer_id: customerId,
          amount: amount.toString(),
          earned_at: new Date(),
          earned_from_order_id: orderId,
        })
        .returning();

      return newRecord[0];
    } catch (error) {
      throw error;
    }
  }

  async redeemCGC(
    customerId: number,
    cgcAmount: number,
    orderId: number
  ) {
    try {
      // Get customer's CGC balance
      const cgcRecords = await db
        .select()
        .from(schema.cgcTokens)
        .where(eq(schema.cgcTokens.customer_id, customerId));

      const totalCGC = cgcRecords.reduce((sum, record) => {
        if (record.redeemed_at) return sum;
        return sum + parseFloat(record.amount);
      }, 0);

      if (totalCGC < cgcAmount) {
        throw new AppError(400, "Insufficient CGC balance");
      }

      // Redeem CGC (1 CGC = 1 KES)
      const redemptionAmount = cgcAmount;

      const updated = await db
        .update(schema.cgcTokens)
        .set({
          redeemed_at: new Date(),
          redeemed_for_order_id: orderId,
          redemption_amount: redemptionAmount.toString(),
        })
        .where(eq(schema.cgcTokens.customer_id, customerId))
        .returning();

      return {
        cgcRedeemed: cgcAmount,
        discountApplied: redemptionAmount,
      };
    } catch (error) {
      throw error;
    }
  }

  async getBalance(customerId: number) {
    try {
      const records = await db
        .select()
        .from(schema.cgcTokens)
        .where(eq(schema.cgcTokens.customer_id, customerId));

      const balance = records.reduce((sum, record) => {
        if (record.redeemed_at) return sum;
        return sum + parseFloat(record.amount);
      }, 0);

      return { customerId, balance };
    } catch (error) {
      throw error;
    }
  }

  async calculateCarbonRevenue() {
    try {
      const allCGC = await db.select().from(schema.cgcTokens);

      const totalEarned = allCGC.reduce(
        (sum, record) => sum + parseFloat(record.amount),
        0
      );

      const totalRedeemed = allCGC.reduce((sum, record) => {
        if (!record.redeemed_at) return sum;
        return sum + parseFloat(record.redemption_amount || "0");
      }, 0);

      return {
        totalEarned,
        totalRedeemed,
        availableRevenue: totalEarned - totalRedeemed,
      };
    } catch (error) {
      throw error;
    }
  }
}

export const cgcService = new CgcService();