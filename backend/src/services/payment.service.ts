import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, sum, desc, inArray, isNull } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";
import { notificationService } from "./notification.service";
import { mpesaService } from "./mpesa.service";

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

  // ========================================================================
  // M-PESA STK PUSH FLOW
  //
  // Ledger entries and order confirmation now happen ONLY after Safaricom's
  // async callback confirms ResultCode 0. Failure callbacks mark the payment
  // as failed but leave the order "pending" so the customer can retry.
  // ========================================================================

  /**
   * Map a M-Pesa failure ResultCode to a short, storable status + human message.
   * Ref: https://developer.safaricom.co.ke/APIs (C2B / STK result codes)
   */
  classifyMpesaFailure(resultCode: number): { status: string; message: string } {
    switch (resultCode) {
      case 1:
        return { status: "failed", message: "Insufficient funds in your M-Pesa account" };
      case 1032:
        return { status: "cancelled", message: "Payment was cancelled before entering a PIN" };
      case 1037:
        return { status: "timeout", message: "The payment request timed out before a PIN was entered" };
      case 2001:
        return { status: "failed", message: "Wrong M-Pesa PIN entered" };
      case 1019:
        return { status: "failed", message: "The phone number is not registered for M-Pesa" };
      case 1001:
        return { status: "failed", message: "The phone number could not be reached" };
      default:
        return { status: "failed", message: "M-Pesa reported the payment could not be completed" };
    }
  }

  /**
   * STEP A (M-Pesa): Record the STK push initiation. NO ledger entries,
   * NO order status change — the order stays "pending" until the callback.
   */
  async initiateMpesaPayment(params: {
    orderId: number;
    amount: number;
    phoneNumber: string;
    merchantRequestId: string;
    checkoutRequestId: string;
  }) {
    const inserted = await db
      .insert(schema.mpesaTransactions)
      .values({
        order_id: params.orderId,
        phone_number: params.phoneNumber,
        amount: params.amount.toString(),
        merchant_request_id: params.merchantRequestId,
        checkout_request_id: params.checkoutRequestId,
        status: "initiated",
      })
      .returning();

    return inserted[0];
  }

  /**
   * STEP B (M-Pesa): Callback says SUCCESS (ResultCode 0).
   * Creates the ledger entries and confirms the order. Idempotent on both the
   * mpesa_transactions row state and existing ledger entries for the order.
   */
  async confirmMpesaPayment(params: {
    checkoutRequestId: string;
    mpesaReceiptNumber?: string;
    callbackAmount?: number;
  }) {
    // 1. Find the tracked initiation
    const tx = await db
      .select()
      .from(schema.mpesaTransactions)
      .where(eq(schema.mpesaTransactions.checkout_request_id, params.checkoutRequestId));

    if (tx.length === 0) {
      throw new AppError(404, `No M-Pesa transaction found for checkout request ${params.checkoutRequestId}`);
    }
    const mpesaTx = tx[0];

    // 2. Claim the row atomically: only the first caller transitions it out of "initiated".
    const claimed = await db
      .update(schema.mpesaTransactions)
      .set({
        status: "success",
        result_code: "0",
        result_desc: "Payment confirmed by M-Pesa callback",
        mpesa_receipt_number: params.mpesaReceiptNumber || null,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(schema.mpesaTransactions.id, mpesaTx.id),
          eq(schema.mpesaTransactions.status, "initiated")
        )
      )
      .returning();

    if (claimed.length === 0) {
      // Safaricom retries callbacks; this one was already processed.
      return { alreadyProcessed: true, orderId: mpesaTx.order_id };
    }

    // 3. Verify the amount the customer actually paid matches what we asked for.
    if (params.callbackAmount !== undefined) {
      const expected = parseFloat(mpesaTx.amount);
      if (Math.abs(params.callbackAmount - expected) > 1) {
        console.error(
          `⚠️ M-Pesa amount mismatch for order ${mpesaTx.order_id}: expected ${expected}, received ${params.callbackAmount}`
        );
      }
    }

    // 4. Load the order
    const order = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, mpesaTx.order_id));

    if (order.length === 0) {
      throw new AppError(404, `Order ${mpesaTx.order_id} not found during payment confirmation`);
    }
    const orderRow = order[0];

    // 5. Already-paid guard (e.g. a previous successful attempt for this order)
    const existingLedger = await db
      .select({ id: schema.ledgerEntries.id })
      .from(schema.ledgerEntries)
      .where(
        and(
          eq(schema.ledgerEntries.order_id, orderRow.id),
          eq(schema.ledgerEntries.entry_type, "order_payment")
        )
      );

    let walletBalances: Record<string, number> = {};
    let ledgerCount = 0;

    if (existingLedger.length === 0) {
      // Create wallets + ledger entries (same split as processPayment)
      const wallets = await this.getOrCreateWallets(
        orderRow.customer_id,
        orderRow.retailer_id,
        1 // OMC ID (hardcoded for now)
      );

      const transactionId = `mpesa-${orderRow.id}-${params.mpesaReceiptNumber || mpesaTx.id}`;
      const amount = parseFloat(orderRow.final_price);
      const entries = await this.createLedgerEntries(transactionId, orderRow.id, amount, wallets);
      ledgerCount = entries.length;

      walletBalances = {
        customer: await this.getWalletBalance(wallets.customer.id),
        retailer: await this.getWalletBalance(wallets.retailer.id),
        omc: await this.getWalletBalance(wallets.omc.id),
        agregas: await this.getWalletBalance(wallets.agregas.id),
      };
    }

    // 6. Confirm the order + mark as paid (idempotent set)
    await db
      .update(schema.orders)
      .set({
        status: "confirmed",
        payment_status: "paid",
        updated_at: new Date(),
      })
      .where(eq(schema.orders.id, orderRow.id));

    // 7. Notify the customer
    await notificationService
      .createNotification(
        orderRow.customer_id,
        "order_update",
        "Payment received",
        `We received your M-Pesa payment of KES ${parseFloat(orderRow.final_price).toFixed(2)} for order #${orderRow.id}.${params.mpesaReceiptNumber ? ` Receipt: ${params.mpesaReceiptNumber}.` : ""}`,
        orderRow.id
      )
      .catch((e) => console.error("Failed to create payment notification:", e.message));

    console.log(`✓ Order ${orderRow.id} confirmed via M-Pesa callback (receipt: ${params.mpesaReceiptNumber || "n/a"})`);

    return {
      alreadyProcessed: false,
      orderId: orderRow.id,
      customerId: orderRow.customer_id,
      ledgerEntriesCreated: ledgerCount,
      walletBalances,
    };
  }

  /**
   * STEP B' (M-Pesa): Callback says FAILURE (wrong PIN, cancelled, timeout,
   * insufficient balance...). Marks the payment failed but leaves the order
   * "pending" so the customer can retry. Never touches the ledger.
   */
  async failMpesaPayment(params: { checkoutRequestId: string; resultCode: number; resultDesc: string }) {
    const tx = await db
      .select()
      .from(schema.mpesaTransactions)
      .where(eq(schema.mpesaTransactions.checkout_request_id, params.checkoutRequestId));

    if (tx.length === 0) {
      throw new AppError(404, `No M-Pesa transaction found for checkout request ${params.checkoutRequestId}`);
    }
    const mpesaTx = tx[0];

    const { status, message } = this.classifyMpesaFailure(params.resultCode);

    // Claim atomically: first callback (success or failure) wins.
    const claimed = await db
      .update(schema.mpesaTransactions)
      .set({
        status,
        result_code: params.resultCode.toString(),
        result_desc: params.resultDesc,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(schema.mpesaTransactions.id, mpesaTx.id),
          eq(schema.mpesaTransactions.status, "initiated")
        )
      )
      .returning();

    if (claimed.length === 0) {
      return { alreadyProcessed: true, orderId: mpesaTx.order_id };
    }

    // Order: keep status "pending" (retryable) but record the payment failure.
    // The guard prevents clobbering if the payment actually succeeded out-of-band.
    const updated = await db
      .update(schema.orders)
      .set({ payment_status: "failed", updated_at: new Date() })
      .where(
        and(
          eq(schema.orders.id, mpesaTx.order_id),
          eq(schema.orders.status, "pending")
        )
      )
      .returning({ id: schema.orders.id, customer_id: schema.orders.customer_id });

    if (updated.length > 0) {
      await notificationService
        .createNotification(
          updated[0].customer_id,
          "payment_due",
          "M-Pesa payment failed",
          `Payment for order #${mpesaTx.order_id} did not go through: ${message}. You can retry from your orders page.`,
          mpesaTx.order_id
        )
        .catch((e) => console.error("Failed to create payment-failure notification:", e.message));
    }

    console.log(`✗ M-Pesa payment failed for order ${mpesaTx.order_id}: [${params.resultCode}] ${params.resultDesc}`);

    return {
      alreadyProcessed: false,
      orderId: mpesaTx.order_id,
      failureStatus: status,
      failureMessage: message,
    };
  }

  /**
   * Backfill the receipt number onto a confirmed mpesa transaction when a
   * late Safaricom callback arrives after query-based confirmation.
   */
  async backfillMpesaReceipt(checkoutRequestId: string, mpesaReceiptNumber?: string) {
    if (!mpesaReceiptNumber) return;
    await db
      .update(schema.mpesaTransactions)
      .set({ mpesa_receipt_number: mpesaReceiptNumber, updated_at: new Date() })
      .where(
        and(
          eq(schema.mpesaTransactions.checkout_request_id, checkoutRequestId),
          eq(schema.mpesaTransactions.status, "success"),
          // Only fill it in if it is missing
          isNull(schema.mpesaTransactions.mpesa_receipt_number)
        )
      );
  }

  /**
   * Active verification: ask Safaricom for the outcome of the in-flight STK
   * push (querySTKStatus) and apply success/failure through the same methods
   * the callback handler uses. Used by GET /payments/verify/:orderId so the
   * frontend gets immediate confirmation without waiting for the async
   * callback or the reconciliation cycle.
   */
  async verifyOrderPayment(orderId: number, userId: number) {
    // Ownership check: only the customer who placed the order may verify it.
    const order = await db
      .select({ id: schema.orders.id, customer_id: schema.orders.customer_id })
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (order.length === 0) {
      throw new AppError(404, "Order not found");
    }
    if (order[0].customer_id !== userId) {
      throw new AppError(403, "Not authorized to verify this order's payment");
    }

    // Latest in-flight STK attempt, if any.
    const tx = await db
      .select()
      .from(schema.mpesaTransactions)
      .where(eq(schema.mpesaTransactions.order_id, orderId))
      .orderBy(desc(schema.mpesaTransactions.created_at))
      .limit(1);

    const latest = tx[0];
    let queriedSafaricom = false;

    // Only ask Safaricom while there is an unresolved push in flight.
    if (latest && latest.status === "initiated" && latest.checkout_request_id) {
      try {
        const result = await mpesaService.querySTKStatus(
          latest.merchant_request_id || "",
          latest.checkout_request_id
        );
        queriedSafaricom = true;
        const resultCode = parseInt(String(result?.ResultCode ?? ""), 10);

        if (result?.ResponseCode === "0" && resultCode === 0) {
          await this.confirmMpesaPayment({
            checkoutRequestId: latest.checkout_request_id,
            callbackAmount: result.Amount ? parseFloat(String(result.Amount)) : undefined,
          });
        } else if (!isNaN(resultCode)) {
          await this.failMpesaPayment({
            checkoutRequestId: latest.checkout_request_id,
            resultCode,
            resultDesc: String(result?.ResultDesc || "Failed per M-Pesa status query"),
          });
        }
        // resultCode NaN => ambiguous response: fall through, report current state.
      } catch (queryError: any) {
        // Safaricom unreachable or query rejected: not fatal — report current
        // state and let the caller keep polling or the reconciliation job act.
        console.log(
          `ℹ️ Payment verify query unavailable for order ${orderId}: ${queryError.message}`
        );
      }
    }

    const state = await this.getOrderPaymentState(orderId);
    return { ...state, queriedSafaricom };
  }

  /**
   * Payment state for frontend polling: order status + latest STK attempt.
   */
  async getOrderPaymentState(orderId: number) {
    const order = await db
      .select({
        id: schema.orders.id,
        status: schema.orders.status,
        payment_status: schema.orders.payment_status,
        final_price: schema.orders.final_price,
        customer_id: schema.orders.customer_id,
      })
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (order.length === 0) {
      throw new AppError(404, "Order not found");
    }

    const latestAttemptRows = await db
      .select({
        id: schema.mpesaTransactions.id,
        status: schema.mpesaTransactions.status,
        result_code: schema.mpesaTransactions.result_code,
        result_desc: schema.mpesaTransactions.result_desc,
        mpesa_receipt_number: schema.mpesaTransactions.mpesa_receipt_number,
        created_at: schema.mpesaTransactions.created_at,
      })
      .from(schema.mpesaTransactions)
      .where(eq(schema.mpesaTransactions.order_id, orderId))
      .orderBy(desc(schema.mpesaTransactions.created_at))
      .limit(1);

    let latestAttempt: any = latestAttemptRows[0] || null;
    if (latestAttempt && latestAttempt.status !== "initiated" && latestAttempt.status !== "success") {
      // Add a customer-friendly message derived from the M-Pesa result code.
      const classified = this.classifyMpesaFailure(parseInt(latestAttempt.result_code || "1", 10));
      latestAttempt = { ...latestAttempt, friendly_message: classified.message };
    }

    // When paid, include the ledger summary so the frontend can render the
    // confirmation screen (entries created + per-wallet balances).
    let ledger: { entriesCreated: number; walletBalances: Record<string, number> } | undefined;
    if (order[0].payment_status === "paid") {
      const entries = await db
        .select()
        .from(schema.ledgerEntries)
        .where(
          and(
            eq(schema.ledgerEntries.order_id, orderId),
            eq(schema.ledgerEntries.entry_type, "order_payment")
          )
        );

      const walletIds = new Set<number>();
      for (const e of entries) {
        walletIds.add(e.debit_wallet_id);
        walletIds.add(e.credit_wallet_id);
      }

      const walletBalances: Record<string, number> = {
        customer: 0,
        retailer: 0,
        omc: 0,
        agregas: 0,
      };

      if (walletIds.size > 0) {
        const wallets = await db
          .select({ id: schema.wallets.id, owner_type: schema.wallets.owner_type })
          .from(schema.wallets)
          .where(inArray(schema.wallets.id, Array.from(walletIds)));

        for (const w of wallets) {
          const balance = await this.getWalletBalance(w.id);
          const key =
            w.owner_type === "customer"
              ? "customer"
              : w.owner_type === "retailer"
              ? "retailer"
              : w.owner_type === "OMC"
              ? "omc"
              : w.owner_type === "AGREGAS"
              ? "agregas"
              : null;
          if (key) walletBalances[key] = balance;
        }
      }

      ledger = { entriesCreated: entries.length, walletBalances };
    }

    return {
      orderId,
      orderStatus: order[0].status,
      paymentStatus: order[0].payment_status,
      finalPrice: order[0].final_price,
      latestAttempt,
      ledger,
    };
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