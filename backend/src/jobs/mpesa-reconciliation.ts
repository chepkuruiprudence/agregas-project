// backend/src/jobs/mpesa-reconciliation.ts
//
// Resolves STK Push attempts whose callback never arrived.
//
// When a customer never enters their PIN (or the handset is offline), Safaricom
// may never deliver a callback, leaving mpesa_transactions rows stuck in
// "initiated" and the order without a final payment state. This job:
//   1. Finds initiated rows older than CALLBACK_WAIT_MINUTES.
//   2. Asks Safaricom directly via the STK query API for the real outcome.
//   3. Applies success/failure through the same confirm/fail service methods
//      used by the callback handler (so notifications and order updates are
//      identical to the normal flow).
//   4. If Safaricom cannot be reached, leaves fresh rows alone and only marks
//      rows older than QUERY_FALLBACK_MINUTES as timed out (retryable).
//
// Runs every 2 minutes. Also exported for manual triggering.

import cron from "node-cron";
import { and, eq, lt } from "drizzle-orm";
import { db } from "../db/index";
import * as schema from "../db/schema";
import { paymentService } from "../services/payment.service";
import { mpesaService } from "../services/mpesa.service";

// Daraja STK prompts expire after ~1-2 minutes on the handset; give the
// callback a generous window before treating a row as stuck.
const CALLBACK_WAIT_MINUTES = 3;
// If the STK query itself keeps failing (network/Daraja outage), only mark
// rows as timed out once they are older than this.
const QUERY_FALLBACK_MINUTES = 10;

export async function reconcileStuckMpesaTransactions(): Promise<{
  checked: number;
  confirmed: number;
  failed: number;
  timedOut: number;
  skipped: number;
}> {
  const cutoff = new Date(Date.now() - CALLBACK_WAIT_MINUTES * 60 * 1000);
  const fallbackCutoff = new Date(
    Date.now() - QUERY_FALLBACK_MINUTES * 60 * 1000
  );

  const stuck = await db
    .select()
    .from(schema.mpesaTransactions)
    .where(
      and(
        eq(schema.mpesaTransactions.status, "initiated"),
        lt(schema.mpesaTransactions.created_at, cutoff)
      )
    );

  const stats = { checked: 0, confirmed: 0, failed: 0, timedOut: 0, skipped: 0 };

  for (const tx of stuck) {
    stats.checked++;
    if (!tx.checkout_request_id) {
      stats.skipped++;
      continue;
    }

    try {
      // Ask Safaricom for the authoritative outcome.
      const result = await mpesaService.querySTKStatus(
        tx.merchant_request_id || "",
        tx.checkout_request_id
      );

      const resultCode = parseInt(String(result?.ResultCode ?? ""), 10);

      if (result?.ResponseCode === "0" && resultCode === 0) {
        // Actually paid — customer completed the PIN entry after all.
        await paymentService.confirmMpesaPayment({
          checkoutRequestId: tx.checkout_request_id,
          mpesaReceiptNumber: result.MpesaReceiptNumber
            ? String(result.MpesaReceiptNumber)
            : undefined,
          callbackAmount: result.Amount
            ? parseFloat(String(result.Amount))
            : undefined,
        });
        stats.confirmed++;
        console.log(
          `✓ Reconciliation: order ${tx.order_id} confirmed via STK query (receipt: ${result.MpesaReceiptNumber})`
        );
      } else if (!isNaN(resultCode)) {
        // Definitive failure reported by Safaricom (cancelled/timeout/etc).
        await paymentService.failMpesaPayment({
          checkoutRequestId: tx.checkout_request_id,
          resultCode,
          resultDesc: String(result?.ResultDesc || "Failed per M-Pesa status query"),
        });
        stats.failed++;
        console.log(
          `✗ Reconciliation: order ${tx.order_id} failed via STK query [${resultCode}]`
        );
      } else {
        // Unrecognized response — leave for the next cycle.
        stats.skipped++;
      }
    } catch (queryError: any) {
      // Query failed (network, Daraja outage, invalid credentials...).
      // Only mark the row timed out once it is unambiguously old — a fresh
      // row stays "initiated" so a later cycle can still resolve it properly.
      if (tx.created_at < fallbackCutoff) {
        await paymentService.failMpesaPayment({
          checkoutRequestId: tx.checkout_request_id,
          resultCode: 1037, // Daraja: "Timeout in responding to request"
          resultDesc: "No M-Pesa callback or query response received (reconciliation timeout)",
        });
        stats.timedOut++;
        console.log(
          `⏱️ Reconciliation: order ${tx.order_id} marked timed out (no callback, query unavailable)`
        );
      } else {
        stats.skipped++;
        console.log(
          `ℹ️ Reconciliation: STK query unavailable for order ${tx.order_id}, will retry next cycle`
        );
      }
    }
  }

  return stats;
}

export function startMpesaReconciliationScheduler() {
  console.log("📅 Starting M-Pesa reconciliation scheduler...");

  cron.schedule("*/2 * * * *", async () => {
    try {
      const stats = await reconcileStuckMpesaTransactions();
      if (stats.checked > 0) {
        console.log(
          `🔄 M-Pesa reconciliation: ${stats.checked} checked, ${stats.confirmed} confirmed, ${stats.failed} failed, ${stats.timedOut} timed out, ${stats.skipped} skipped`
        );
      }
    } catch (error: any) {
      console.error("❌ M-Pesa reconciliation error:", error.message);
    }
  });

  console.log("✓ M-Pesa reconciliation scheduler started (runs every 2 minutes)");
}
