import {
  pgTable,
  serial,
  integer,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.table";
import { orders } from "./orders.table";

export const cgcTokens = pgTable(
  "cgc_tokens",
  {
    id: serial("id").primaryKey(),
    customer_id: integer("customer_id")
      .notNull()
      .references(() => users.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    earned_at: timestamp("earned_at", { withTimezone: true }),
    earned_from_order_id: integer("earned_from_order_id").references(
      () => orders.id
    ),
    redeemed_at: timestamp("redeemed_at", { withTimezone: true }),
    redeemed_for_order_id: integer("redeemed_for_order_id").references(
      () => orders.id
    ),
    redemption_amount: decimal("redemption_amount", { precision: 10, scale: 2 }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdIdx: index("cgc_tokens_customer_id_idx").on(table.customer_id),
    earnedAtIdx: index("cgc_tokens_earned_at_idx").on(table.earned_at),
  })
);