import {
  pgTable,
  serial,
  integer,
  decimal,
  varchar,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.table";

export const gasCredit = pgTable(
  "gas_credit",
  {
    id: serial("id").primaryKey(),
    customer_id: integer("customer_id")
      .notNull()
      .references(() => users.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    interest_rate: decimal("interest_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    repayment_balance: decimal("repayment_balance", { precision: 10, scale: 2 })
      .notNull(),
    repayment_schedule: jsonb("repayment_schedule"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdIdx: index("gas_credit_customer_id_idx").on(table.customer_id),
    statusIdx: index("gas_credit_status_idx").on(table.status),
  })
);