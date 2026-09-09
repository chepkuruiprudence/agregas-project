// backend/src/db/tables/mpesa-transactions.table.ts
// Tracks every STK Push initiation so Safaricom's async callbacks (which only
// echo CheckoutRequestID) can be correlated back to the originating order.

import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { orders } from "./orders.table";

export const mpesaTransactions = pgTable(
  "mpesa_transactions",
  {
    id: serial("id").primaryKey(),
    order_id: integer("order_id")
      .notNull()
      .references(() => orders.id),
    phone_number: varchar("phone_number", { length: 20 }).notNull(),
    amount: varchar("amount", { length: 20 }).notNull(),

    merchant_request_id: varchar("merchant_request_id", { length: 100 }),
    checkout_request_id: varchar("checkout_request_id", { length: 100 }),

    // "initiated" -> "success" | "failed" | "cancelled" | "timeout"
    status: varchar("status", { length: 20 }).notNull().default("initiated"),
    result_code: varchar("result_code", { length: 20 }),
    result_desc: text("result_desc"),
    mpesa_receipt_number: varchar("mpesa_receipt_number", { length: 50 }),

    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("mpesa_transactions_order_id_idx").on(table.order_id),
    checkoutRequestIdIdx: index("mpesa_transactions_checkout_idx").on(
      table.checkout_request_id
    ),
    merchantRequestIdIdx: index("mpesa_transactions_merchant_idx").on(
      table.merchant_request_id
    ),
    statusIdx: index("mpesa_transactions_status_idx").on(table.status),
  })
);

export type MpesaTransaction = typeof mpesaTransactions.$inferSelect;
export type MpesaTransactionInsert = typeof mpesaTransactions.$inferInsert;
