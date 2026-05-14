import {
  pgTable,
  serial,
  integer,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import {
  subscriptionTierEnum,
  subscriptionStatusEnum,
} from "../enums";
import { users } from "./users.table";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    customer_id: integer("customer_id")
      .notNull()
      .references(() => users.id),
    tier: subscriptionTierEnum("tier").notNull(),
    deposit_amount: decimal("deposit_amount", { precision: 10, scale: 2 })
      .notNull(),
    current_balance: decimal("current_balance", { precision: 10, scale: 2 })
      .notNull(),
    rollover_percentage: integer("rollover_percentage").notNull().default(50),
    rollover_amount: decimal("rollover_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    expiry_date: timestamp("expiry_date", { withTimezone: true }).notNull(),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdIdx: index("subscriptions_customer_id_idx").on(table.customer_id),
    statusIdx: index("subscriptions_status_idx").on(table.status),
    expiryDateIdx: index("subscriptions_expiry_date_idx").on(table.expiry_date),
  })
);