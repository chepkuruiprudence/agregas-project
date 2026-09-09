// backend/scripts/audit-phantom-payments.mjs
//
// Finds "phantom" M-Pesa payments: ledger entries recorded as order payments
// that are NOT backed by a confirmed M-Pesa receipt.
//
// Background: the old payment flow created ledger entries the moment an STK
// push was initiated (before any PIN entry), and marked orders "confirmed"
// even when the customer never paid. Those entries and orders are phantoms.
//
// A ledger entry is phantom when (entry_type = 'order_payment'):
//   1. Its transaction_id does not start with "mpesa-" (legacy eager-flow
//      format: "order-<id>-<ts>" / "tx-<id>-<ts>" — no receipt linkage), OR
//   2. Its order has NO mpesa_transactions row with status = 'success'
//      (i.e. no Safaricom callback or STK-query confirmation ever arrived).
//
// Usage (from the backend/ directory):
//   node scripts/audit-phantom-payments.mjs          # report only (safe)
//   node scripts/audit-phantom-payments.mjs --fix    # reverse phantoms
//
// What --fix does (additive, never deletes — the ledger is immutable):
//   1. Inserts a mirror-reversal ledger entry for every phantom entry
//      (transaction_id "<orig>-reversal", entry_type "order_payment_reversal").
//   2. Reverts phantom-paid orders (status was "confirmed" only because of the
//      phantom payment) back to status "pending" + payment_status "pending",
//      so the customer can retry through the new callback-confirmed flow.
//   3. Idempotent: entries already reversed are skipped on re-runs.

import "dotenv/config";
import pg from "pg";

const FIX = process.argv.includes("--fix");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set (check backend/.env)");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const PHANTOM_QUERY = `
  SELECT
    le.id            AS entry_id,
    le.transaction_id,
    le.order_id,
    le.amount,
    le.status        AS ledger_status,
    le.created_at    AS entry_created_at,
    o.status         AS order_status,
    o.payment_status AS order_payment_status,
    o.brand,
    o.cylinder_size,
    o.quantity,
    o.final_price,
    o.customer_id,
    (SELECT COUNT(*)::int FROM mpesa_transactions mt
       WHERE mt.order_id = le.order_id AND mt.status = 'success') AS success_count,
    (SELECT COUNT(*)::int FROM ledger_entries r
       WHERE r.transaction_id = le.transaction_id || '-reversal') AS reversal_count
  FROM ledger_entries le
  JOIN orders o ON o.id = le.order_id
  WHERE le.entry_type = 'order_payment'
    AND (
      le.transaction_id NOT LIKE 'mpesa-%'
      OR (SELECT COUNT(*) FROM mpesa_transactions mt
            WHERE mt.order_id = le.order_id AND mt.status = 'success') = 0
    )
  ORDER BY le.order_id, le.id
`;

function money(n) {
  return `KES ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

(async () => {
  const { rows: phantoms } = await pool.query(PHANTOM_QUERY);

  console.log("=".repeat(78));
  console.log("PHANTOM PAYMENT AUDIT");
  console.log("=".repeat(78));

  if (phantoms.length === 0) {
    console.log("\n✅ No phantom payments found. All order_payment ledger entries");
    console.log("   are backed by a confirmed M-Pesa transaction.\n");
    await pool.end();
    return;
  }

  // Group by order for a readable report
  const byOrder = new Map();
  for (const p of phantoms) {
    if (!byOrder.has(p.order_id)) byOrder.set(p.order_id, []);
    byOrder.get(p.order_id).push(p);
  }

  console.log(
    `\nFound ${phantoms.length} phantom ledger entr${phantoms.length === 1 ? "y" : "ies"} across ${byOrder.size} order${byOrder.size === 1 ? "" : "s"}:\n`
  );

  let totalAmount = 0;
  let ordersToRevert = 0;

  for (const [orderId, entries] of byOrder) {
    const first = entries[0];
    // The base entry (transaction_id without -omc/-retailer/-agregas suffix)
    // carries the full amount taken from the customer; the suffixed ones are
    // the distribution splits of the same money. Sum only base entries.
    const isBaseEntry = (e) =>
      !e.transaction_id.endsWith("-omc") &&
      !e.transaction_id.endsWith("-retailer") &&
      !e.transaction_id.endsWith("-agregas");
    const baseEntries = entries.filter(isBaseEntry);
    const reportedTotal = baseEntries.length > 0
      ? baseEntries.reduce((s, e) => s + Number(e.amount), 0)
      : entries.reduce((s, e) => s + Number(e.amount), 0);
    totalAmount += reportedTotal;
    const isPhantomPaid = first.order_status === "confirmed" && first.success_count === 0;
    if (isPhantomPaid) ordersToRevert++;

    console.log(`Order #${orderId} — ${first.brand} ${first.cylinder_size} ×${first.quantity} (customer ${first.customer_id})`);
    console.log(`  order status: ${first.order_status} | payment_status: ${first.order_payment_status} | confirmed M-Pesa receipts: ${first.success_count}`);
    console.log(`  ${isPhantomPaid ? "⚠️  PHANTOM-PAID (marked confirmed with no receipt — customer never actually paid)" : "   (order not confirmed; entries are orphaned)"}`);
    for (const e of entries) {
      const legacy = !e.transaction_id.startsWith("mpesa-") ? " [legacy format]" : "";
      const reversed = e.reversal_count > 0 ? " [already reversed]" : "";
      console.log(`    entry #${e.entry_id}: ${money(e.amount)}  tx="${e.transaction_id}"${legacy}${reversed}  (${new Date(e.entry_created_at).toISOString()})`);
    }
    console.log("");
  }

  console.log("-".repeat(78));
  console.log(`Total phantom payment value: ${money(totalAmount)}`);
  console.log(`Orders to revert to payable state: ${ordersToRevert}`);
  console.log("-".repeat(78));

  if (!FIX) {
    console.log("\nThis was a REPORT ONLY — nothing was changed.");
    console.log("To reverse these phantom entries (additive reversal, never deletion):");
    console.log("  node scripts/audit-phantom-payments.mjs --fix\n");
    await pool.end();
    return;
  }

  // ---------------- FIX MODE ----------------
  const client = await pool.connect();
  let reversedEntries = 0;
  let revertedOrders = 0;
  let skippedAlreadyReversed = 0;

  try {
    await client.query("BEGIN");

    for (const [orderId, entries] of byOrder) {
      const first = entries[0];

      for (const e of entries) {
        if (e.reversal_count > 0) {
          skippedAlreadyReversed++;
          continue;
        }
        await client.query(
          `INSERT INTO ledger_entries
             (transaction_id, order_id, debit_wallet_id, credit_wallet_id,
              amount, currency, entry_type, reference_type, reference_id, status)
           VALUES ($1, $2, $3, $4, $5, 'KES', 'order_payment_reversal', 'order', $2, 'posted')`,
          [
            `${e.transaction_id}-reversal`,
            e.order_id,
            e.credit_wallet_id ?? (await client.query("SELECT credit_wallet_id FROM ledger_entries WHERE id = $1", [e.entry_id])).rows[0].credit_wallet_id,
            e.debit_wallet_id ?? (await client.query("SELECT debit_wallet_id FROM ledger_entries WHERE id = $1", [e.entry_id])).rows[0].debit_wallet_id,
            e.amount,
          ]
        );
        reversedEntries++;
      }

      // Revert phantom-paid orders so the customer can pay through the new flow.
      if (first.order_status === "confirmed" && first.success_count === 0) {
        await client.query(
          `UPDATE orders
              SET status = 'pending', payment_status = 'pending', updated_at = NOW()
            WHERE id = $1 AND status = 'confirmed'`,
          [orderId]
        );
        revertedOrders++;
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Fix failed, rolled back:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }

  console.log("=".repeat(78));
  console.log("FIX COMPLETE");
  console.log(`  reversal entries inserted : ${reversedEntries}`);
  console.log(`  entries already reversed  : ${skippedAlreadyReversed}`);
  console.log(`  orders reverted to pending: ${revertedOrders}`);
  console.log("=".repeat(78));
  console.log("\nRe-run without --fix to verify the audit now comes back clean.\n");

  await pool.end();
})().catch((err) => {
  console.error("❌ Audit failed:", err.message);
  process.exit(1);
});
