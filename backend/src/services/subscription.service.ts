import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

const TIER_CONFIG = {
  basic: { depositAmount: 500, monthlyCredit: 500 },
  standard: { depositAmount: 1000, monthlyCredit: 1000 },
  premium: { depositAmount: 2000, monthlyCredit: 2000 },
};

export class SubscriptionService {
  async createSubscription(
    customerId: number,
    tier: "basic" | "standard" | "premium",
    depositAmount: number
  ) {
    try {
      const config = TIER_CONFIG[tier];

      // Validate deposit
      if (depositAmount < config.depositAmount) {
        throw new AppError(
          400,
          `Minimum deposit for ${tier} is ${config.depositAmount} KES`
        );
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const newSubscription = await db
        .insert(schema.subscriptions)
        .values({
          customer_id: customerId,
          tier: tier as any,
          deposit_amount: depositAmount.toString(),
          current_balance: depositAmount.toString(),
          rollover_percentage: 20,
          rollover_amount: "0",
          expiry_date: expiryDate,
          status: "active",
        })
        .returning();

      return newSubscription[0];
    } catch (error) {
      throw error;
    }
  }

  async renewSubscription(subscriptionId: number) {
    try {
      const sub = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.id, subscriptionId));

      if (sub.length === 0) {
        throw new AppError(404, "Subscription not found");
      }

      const subscription = sub[0];
      const unusedBalance = parseFloat(subscription.current_balance);

      // Apply forfeiture logic
      let rolloverAmount = 0;
      if (unusedBalance > 0) {
        const depositAmount = parseFloat(subscription.deposit_amount);
        if (unusedBalance > depositAmount * 0.5) {
          // More than 50% unused - apply forfeiture
          rolloverAmount = (unusedBalance * 20) / 100; // Only 20% rolls over
        } else {
          // Less than 50% unused - full rollover
          rolloverAmount = unusedBalance;
        }
      }

      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 30);

      const newBalance = rolloverAmount + parseFloat(subscription.deposit_amount);

      const updated = await db
        .update(schema.subscriptions)
        .set({
          current_balance: newBalance.toString(),
          rollover_amount: rolloverAmount.toString(),
          expiry_date: newExpiryDate,
          status: "active",
        })
        .where(eq(schema.subscriptions.id, subscriptionId))
        .returning();

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: number) {
    try {
      const updated = await db
        .update(schema.subscriptions)
        .set({ status: "cancelled" })
        .where(eq(schema.subscriptions.id, subscriptionId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "Subscription not found");
      }

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  async getSubscription(subscriptionId: number) {
    try {
      const sub = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.id, subscriptionId));

      if (sub.length === 0) {
        throw new AppError(404, "Subscription not found");
      }

      return sub[0];
    } catch (error) {
      throw error;
    }
  }

  async checkForfeiture(subscription: any) {
    const unusedBalance = parseFloat(subscription.current_balance);
    const depositAmount = parseFloat(subscription.deposit_amount);

    if (unusedBalance > depositAmount * 0.5) {
      return {
        forfeited: true,
        amount: unusedBalance - (unusedBalance * 20) / 100,
        rolledOver: (unusedBalance * 20) / 100,
      };
    }

    return {
      forfeited: false,
      amount: 0,
      rolledOver: unusedBalance,
    };
  }
}

export const subscriptionService = new SubscriptionService();