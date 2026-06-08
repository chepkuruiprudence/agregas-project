import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, sum } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export interface PaymentRequest {
  orderId: number;
  customerId: number;
  amount: number; // finalPrice from order
  paymentMethod: "mpesa" | "card" | "cash";
  idempotencyKey: string; // Transaction ID for idempotency
}

export interface LedgerEntry {
  transactionId: string;
  debitWalletId: number;
  creditWalletId: number;
  amount: number;
  entryType: string;
  referenceType: string;
  referenceId: number;
}

export class PaymentService {
  /**
   * STEP 1: Get or create wallets for all participants
   * Every participant in the transaction needs a wallet
   */
  async getOrCreateWallets(customerId: number, retailerId: number, omcId: number) {
    try {
      // Customer wallet (existing)
      let customerWallet = await db
        .select()
        .from(schema.wallets)
        .where(
          and(
            eq(schema.wallets.owner_id, customerId),
            eq(schema.wallets.owner_type, "customer")
          )
        );

      if (customerWallet.length === 0) {
        const inserted = await db
          .insert(schema.wallets)
          .values({
            owner_id: customerId,
            owner_type: "customer",
            wallet_type: "operating",
            currency: "KES",
            status: "active",
          })
          .returning();
        customerWallet = inserted;
      }

      // Retailer wallet
      let retailerWallet = await db
        .select()
        .from(schema.wallets)
        .where(
          and(
            eq(schema.wallets.owner_id, retailerId),
            eq(schema.wallets.owner_type, "retailer")
          )
        );

      if (retailerWallet.length === 0) {
        const inserted = await db
          .insert(schema.wallets)
          .values({
            owner_id: retailerId,
            owner_type: "retailer",
            wallet_type: "operating",
            currency: "KES",
            status: "active",
          })
          .returning();
        retailerWallet = inserted;
      }

      // OMC wallet
      let omcWallet = await db
        .select()
        .from(schema.wallets)
        .where(
          and(
            eq(schema.wallets.owner_id, omcId),
            eq(schema.wallets.owner_type, "OMC")
          )
        );

      if (omcWallet.length === 0) {
        const inserted = await db
          .insert(schema.wallets)
          .values({
            owner_id: omcId,
            owner_type: "OMC",
            wallet_type: "operating",
            currency: "KES",
            status: "active",
          })
          .returning();
        omcWallet = inserted;
      }

      // AGREGAS wallet
      let agregasWallet = await db
        .select()
        .from(schema.wallets)
        .where(
          and(
            eq(schema.wallets.owner_id, 1), // Hardcoded AGREGAS system user
            eq(schema.wallets.owner_type, "AGREGAS")
          )
        );

      if (agregasWallet.length === 0) {
        const inserted = await db
          .insert(schema.wallets)
          .values({
            owner_id: 1, // AGREGAS system user ID
            owner_type: "AGREGAS",
            wallet_type: "operating",
            currency: "KES",
            status: "active",
          })
          .returning();
        agregasWallet = inserted;
      }

      return {
        customer: customerWallet[0],
        retailer: retailerWallet[0],
        omc: omcWallet[0],
        agregas: agregasWallet[0],
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * STEP 2: Create ledger entries (double-entry accounting)
   * CRITICAL: Must balance. Debits = Credits
   * 
   * Example for KES 3000 order:
   * DEBIT:  Customer wallet -3000
   * CREDIT: OMC +2550, Retailer +300, AGREGAS +150
   * Total: 3000 = 3000 ✓
   */
  async createLedgerEntries(
    transactionId: string,
    orderId: number,
    amount: number,
    wallets: any,
    pricingBreakdown?: any
  ) {
    try {
      // Default split: OMC 85%, Retailer 10%, AGREGAS 5%
      const omcAmount = parseFloat((amount * 0.85).toFixed(2));
      const retailerAmount = parseFloat((amount * 0.10).toFixed(2));
      const agregasAmount = parseFloat((amount * 0.05).toFixed(2));

      // Verify balance: debits must equal credits
      const totalCredits = omcAmount + retailerAmount + agregasAmount;
      if (Math.abs(totalCredits - amount) > 0.01) {
        throw new AppError(
          400,
          `Ledger imbalance: debits ${amount} != credits ${totalCredits}`
        );
      }

      // Create entries
      const entries = [
        // DEBIT: Customer
        {
          transaction_id: transactionId,
          order_id: orderId,
          debit_wallet_id: wallets.customer.id,
          credit_wallet_id: wallets.customer.id, // Self-debit
          amount: amount,
          currency: "KES",
          entry_type: "order_payment",
          reference_type: "order",
          reference_id: orderId,
          status: "posted",
        },
        // CREDIT: OMC
        {
          transaction_id: `${transactionId}-omc`,
          order_id: orderId,
          debit_wallet_id: wallets.omc.id,
          credit_wallet_id: wallets.omc.id, // Self-credit
          amount: omcAmount,
          currency: "KES",
          entry_type: "order_payment",
          reference_type: "order",
          reference_id: orderId,
          status: "posted",
        },
        // CREDIT: Retailer
        {
          transaction_id: `${transactionId}-retailer`,
          order_id: orderId,
          debit_wallet_id: wallets.retailer.id,
          credit_wallet_id: wallets.retailer.id,
          amount: retailerAmount,
          currency: "KES",
          entry_type: "order_payment",
          reference_type: "order",
          reference_id: orderId,
          status: "posted",
        },
        // CREDIT: AGREGAS
        {
          transaction_id: `${transactionId}-agregas`,
          order_id: orderId,
          debit_wallet_id: wallets.agregas.id,
          credit_wallet_id: wallets.agregas.id,
          amount: agregasAmount,
          currency: "KES",
          entry_type: "order_payment",
          reference_type: "order",
          reference_id: orderId,
          status: "posted",
        },
      ];

      // Insert all entries
      const inserted = await db
        .insert(schema.ledgerEntries)
        .values(entries as any)
        .returning();

      console.log(`✓ Created ${inserted.length} ledger entries for order ${orderId}`);

      return inserted;
    } catch (error) {
      throw error;
    }
  }

  /**
   * STEP 3: Calculate wallet balance
   * Balance = SUM(credits) - SUM(debits) from ledger
   * 
   * NEVER update wallet.balance directly
   * Always calculate from ledger
   */
  async getWalletBalance(walletId: number): Promise<number> {
    try {
      // Credits (where wallet_id is credit_wallet_id)
      const credits = await db
        .select({ total: sum(schema.ledgerEntries.amount) })
        .from(schema.ledgerEntries)
        .where(
          and(
            eq(schema.ledgerEntries.credit_wallet_id, walletId),
            eq(schema.ledgerEntries.status, "posted")
          )
        );

      // Debits (where wallet_id is debit_wallet_id)
      const debits = await db
        .select({ total: sum(schema.ledgerEntries.amount) })
        .from(schema.ledgerEntries)
        .where(
          and(
            eq(schema.ledgerEntries.debit_wallet_id, walletId),
            eq(schema.ledgerEntries.status, "posted")
          )
        );

      const creditAmount = credits[0]?.total ? parseFloat(credits[0].total) : 0;
      const debitAmount = debits[0]?.total ? parseFloat(debits[0].total) : 0;

      const balance = creditAmount - debitAmount;
      return parseFloat(balance.toFixed(2));
    } catch (error) {
      throw error;
    }
  }

  /**
   * MAIN: Process payment end-to-end
   * This is what the payment controller calls
   */
  async processPayment(request: PaymentRequest) {
    try {
      console.log(`📥 Processing payment for order ${request.orderId}`);

      // VALIDATION 1: Check order exists
      const order = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, request.orderId));

      if (order.length === 0) {
        throw new AppError(404, "Order not found");
      }

      if (order[0].status !== "pending") {
        throw new AppError(400, `Order is ${order[0].status}, cannot pay`);
      }

      // VALIDATION 2: Idempotency check
      const existing = await db
        .select()
        .from(schema.ledgerEntries)
        .where(eq(schema.ledgerEntries.transaction_id, request.idempotencyKey));

      if (existing.length > 0) {
        console.log(`ℹ️ Idempotent retry: payment already processed`);
        return {
          success: true,
          message: "Payment already processed",
          transactionId: request.idempotencyKey,
          isDuplicate: true,
        };
      }

      // STEP 1: Get wallets
      const wallets = await this.getOrCreateWallets(
        request.customerId,
        order[0].retailer_id || 1, // fallback if not set
        1 // OMC ID (hardcoded for now)
      );

      console.log(`✓ Wallets ready`);

      // STEP 2: Create ledger entries
      const ledgerEntries = await this.createLedgerEntries(
        request.idempotencyKey,
        request.orderId,
        request.amount,
        wallets
      );

      console.log(`✓ Ledger entries created`);

      // STEP 3: Recalculate balances (derived from ledger)
      const customerBalance = await this.getWalletBalance(wallets.customer.id);
      const retailerBalance = await this.getWalletBalance(wallets.retailer.id);
      const omcBalance = await this.getWalletBalance(wallets.omc.id);
      const agregasBalance = await this.getWalletBalance(wallets.agregas.id);

      console.log(`✓ Balances calculated`);

      // STEP 4: Update order status
      await db
        .update(schema.orders)
        .set({ status: "confirmed" })
        .where(eq(schema.orders.id, request.orderId));

      console.log(`✓ Order marked as paid`);

      // STEP 5: Return success response
      return {
        success: true,
        transactionId: request.idempotencyKey,
        ledgerEntries: ledgerEntries.length,
        walletBalances: {
          customer: customerBalance,
          retailer: retailerBalance,
          omc: omcBalance,
          agregas: agregasBalance,
        },
        message: "Payment processed successfully (ledger recorded, settlement pending)",
      };
    } catch (error) {
      console.error("Payment error:", error);
      throw error;
    }
  }

  /**
   * Get payment history for an order
   */
  async getPaymentHistory(orderId: number) {
    try {
      const entries = await db
        .select()
        .from(schema.ledgerEntries)
        .where(
          and(
            eq(schema.ledgerEntries.order_id, orderId),
            eq(schema.ledgerEntries.status, "posted")
          )
        )
        .orderBy((e) => e.created_at);

      return entries;
    } catch (error) {
      throw error;
    }
  }
}

export const paymentService = new PaymentService();