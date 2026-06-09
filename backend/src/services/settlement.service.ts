// backend/src/services/settlement.service.ts

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, gte, lte, sum } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export interface SettlementCycleConfig {
  cycleStartTime: string; // "22:00" (10 PM)
  cycleEndTime: string; // "22:00" (10 PM next day)
  currencyCode: string; // "KES"
  enableAutoSettle: boolean; // Auto-execute payouts
}

export class SettlementService {
  /**
   * STEP 1: Create a new settlement cycle
   * Called once per day (e.g., at 22:00)
   */
  async createSettlementCycle(): Promise<any> {
    try {
      console.log("📊 Creating new settlement cycle");

      // Get highest cycle number to create sequential IDs
      const lastCycle = await db
        .select({ cycleNumber: schema.settlementCycles.cycle_number })
        .from(schema.settlementCycles)
        .orderBy((c) => c.cycleNumber)
        .limit(1);

      const cycleNumber = (lastCycle[0]?.cycleNumber || 0) + 1;

      // Calculate times
      const now = new Date();
      const cycleStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      const cycleEnd = now;

      const cycle = await db
        .insert(schema.settlementCycles)
        .values({
          cycle_number: cycleNumber,
          cycle_start: cycleStart,
          cycle_end: cycleEnd,
          status: "open",
          total_gross_value: "0",
          total_net_value: "0",
        })
        .returning();

      console.log(`✓ Settlement cycle ${cycleNumber} created`);
      return cycle[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * STEP 2: Close a settlement cycle
   * Prevents new transactions from being added
   */
  async closeSettlementCycle(cycleId: number): Promise<any> {
    try {
      console.log(`📊 Closing settlement cycle ${cycleId}`);

      const updated = await db
        .update(schema.settlementCycles)
        .set({ status: "closed" })
        .where(eq(schema.settlementCycles.id, cycleId))
        .returning();

      console.log(`✓ Settlement cycle ${cycleId} closed`);
      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * STEP 3: Get all transactions in a cycle
   * Query ledger entries within the cycle's time window
   */
  async getTransactionsInCycle(cycleId: number): Promise<any[]> {
    try {
      const cycle = await db
        .select()
        .from(schema.settlementCycles)
        .where(eq(schema.settlementCycles.id, cycleId));

      if (cycle.length === 0) {
        throw new AppError(404, "Settlement cycle not found");
      }

      const c = cycle[0];

      const transactions = await db
        .select()
        .from(schema.ledgerEntries)
        .where(
          and(
            eq(schema.ledgerEntries.status, "posted"),
            gte(schema.ledgerEntries.created_at, c.cycle_start),
            lte(schema.ledgerEntries.created_at, c.cycle_end)
          )
        );

      console.log(
        `✓ Found ${transactions.length} transactions in cycle ${cycleId}`
      );
      return transactions;
    } catch (error) {
      throw error;
    }
  }

  /**
   * STEP 4: NETTING ENGINE - Calculate net positions
   *
   * Example:
   * OMC transacts with:
   *   - Retailer A: OMC earns 100K
   *   - Retailer B: OMC earns 50K
   *   Total receivable: 150K
   *
   * Instead of 2 transfers (100K + 50K), net into 1 transfer (150K)
   *
   * This reduces transaction costs by ~90%
   */
  async calculateNetPositions(
    cycleId: number
  ): Promise<
    Array<{
      fromWalletId: number;
      toWalletId: number;
      grossReceivable: number;
      grossPayable: number;
      netAmount: number;
      direction: "receivable" | "payable";
    }>
  > {
    try {
      console.log(`🧮 Calculating net positions for cycle ${cycleId}`);

      const transactions = await this.getTransactionsInCycle(cycleId);

      // Map to track positions: walletA -> walletB = amount
      const positions: Map<string, { receivable: number; payable: number }> =
        new Map();

      // Process each transaction
      for (const tx of transactions) {
        const key = `${tx.debit_wallet_id}>${tx.credit_wallet_id}`;
        const reverseKey = `${tx.credit_wallet_id}>${tx.debit_wallet_id}`;
        const amount = parseFloat(tx.amount);

        // Initialize if needed
        if (!positions.has(key)) {
          positions.set(key, { receivable: 0, payable: 0 });
        }

        // A owes B
        positions.get(key)!.payable += amount;

        // B receives from A
        if (!positions.has(reverseKey)) {
          positions.set(reverseKey, { receivable: 0, payable: 0 });
        }
        positions.get(reverseKey)!.receivable += amount;
      }

      // Calculate NET: receivable - payable
      const netPositions: Array<{
        fromWalletId: number;
        toWalletId: number;
        grossReceivable: number;
        grossPayable: number;
        netAmount: number;
        direction: "receivable" | "payable";
      }> = [];

      for (const [key, pos] of positions) {
        const [fromId, toId] = key.split(">").map(Number);
        const netAmount = pos.receivable - pos.payable;

        if (Math.abs(netAmount) > 0.01) {
          // Only include if amount is significant (> 1 cent)
          netPositions.push({
            fromWalletId: fromId,
            toWalletId: toId,
            grossReceivable: pos.receivable,
            grossPayable: pos.payable,
            netAmount: parseFloat(netAmount.toFixed(2)),
            direction: netAmount > 0 ? "receivable" : "payable",
          });
        }
      }

      console.log(`✓ Calculated ${netPositions.length} net positions`);
      console.log(
        "Netting summary:",
        netPositions.map((p) => ({
          from: p.fromWalletId,
          to: p.toWalletId,
          net: p.netAmount,
          direction: p.direction,
        }))
      );

      return netPositions;
    } catch (error) {
      throw error;
    }
  }

  /**
   * STEP 5: Create settlement obligations
   * These are the ACTUAL amounts that will be paid out
   */
  async createSettlementObligations(cycleId: number): Promise<any[]> {
    try {
      console.log(`📝 Creating settlement obligations for cycle ${cycleId}`);

      const netPositions = await this.calculateNetPositions(cycleId);

      if (netPositions.length === 0) {
        console.log("⚠️  No net positions to settle");
        return [];
      }

      const obligations = [];
      let totalNetValue = 0;

      for (const pos of netPositions) {
        const obligation = await db
          .insert(schema.settlementObligations)
          .values({
            settlement_cycle_id: cycleId,
            from_wallet_id: pos.fromWalletId,
            to_wallet_id: pos.toWalletId,
            gross_receivable: pos.grossReceivable.toString(),
            gross_payable: pos.grossPayable.toString(),
            net_amount: Math.abs(pos.netAmount).toString(),
            direction: pos.netAmount > 0 ? "receivable" : "payable",
            status: "pending",
          })
          .returning();

        obligations.push(obligation[0]);
        totalNetValue += Math.abs(pos.netAmount);
      }

      // Update cycle with total value
      await db
        .update(schema.settlementCycles)
        .set({
          total_net_value: totalNetValue.toString(),
        })
        .where(eq(schema.settlementCycles.id, cycleId));

      console.log(`✓ Created ${obligations.length} settlement obligations`);
      console.log(`💰 Total net value: KES ${totalNetValue.toLocaleString()}`);

      return obligations;
    } catch (error) {
      throw error;
    }
  }

  /**
   * STEP 6: Execute settlement
   * Transfers money from one wallet to another
   * (In real system: call M-Pesa B2B API, bank API, etc)
   */
  async executeSettlement(cycleId: number): Promise<void> {
    try {
      console.log(`💸 Executing settlement for cycle ${cycleId}`);

      // Get all pending obligations
      const obligations = await db
        .select()
        .from(schema.settlementObligations)
        .where(
          and(
            eq(schema.settlementObligations.settlement_cycle_id, cycleId),
            eq(schema.settlementObligations.status, "pending")
          )
        );

      if (obligations.length === 0) {
        console.log("No obligations to settle");
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const obligation of obligations) {
        try {
          console.log(
            `💸 Processing: Wallet ${obligation.from_wallet_id} → ${obligation.to_wallet_id}, Amount: ${obligation.net_amount}`
          );

          // 🔧 TODO: Call actual payment API here
          // Examples:
          // - M-Pesa B2B Disbursement API
          // - Bank transfer API (SWIFT, RTGS, etc)
          // - Internal account transfer (if both are AGREGAS users)

          // For now, just mark as settled
          await db
            .update(schema.settlementObligations)
            .set({
              status: "settled",
              settled_at: new Date(),
            })
            .where(eq(schema.settlementObligations.id, obligation.id));

          successCount++;
          console.log(`✓ Settled obligation ${obligation.id}`);
        } catch (error) {
          console.error(
            `❌ Failed to settle obligation ${obligation.id}:`,
            error
          );
          failCount++;

          // Mark as failed but don't throw (continue with others)
          await db
            .update(schema.settlementObligations)
            .set({
              status: "failed",
              settled_at: new Date(),
            })
            .where(eq(schema.settlementObligations.id, obligation.id));
        }
      }

      // Update cycle status
      const newStatus =
        failCount === 0 ? "settled" : failCount < successCount ? "partial" : "failed";

      await db
        .update(schema.settlementCycles)
        .set({
          status: newStatus,
          settled_at: new Date(),
        })
        .where(eq(schema.settlementCycles.id, cycleId));

      console.log(`✓ Settlement complete: ${successCount} succeeded, ${failCount} failed`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * STEP 7: Get settlement summary for dashboard
   */
  async getSettlementSummary(cycleId: number): Promise<any> {
    try {
      const cycle = await db
        .select()
        .from(schema.settlementCycles)
        .where(eq(schema.settlementCycles.id, cycleId));

      if (cycle.length === 0) {
        throw new AppError(404, "Settlement cycle not found");
      }

      const obligations = await db
        .select()
        .from(schema.settlementObligations)
        .where(eq(schema.settlementObligations.settlement_cycle_id, cycleId));

      const settled = obligations.filter((o) => o.status === "settled").length;
      const pending = obligations.filter((o) => o.status === "pending").length;
      const failed = obligations.filter((o) => o.status === "failed").length;

      return {
        cycle: cycle[0],
        obligations: {
          total: obligations.length,
          settled,
          pending,
          failed,
        },
        summary: obligations.map((o) => ({
          fromWallet: o.from_wallet_id,
          toWallet: o.to_wallet_id,
          amount: parseFloat(o.net_amount),
          direction: o.direction,
          status: o.status,
        })),
      };
    } catch (error) {
      throw error;
    }
  }
}

export const settlementService = new SettlementService();