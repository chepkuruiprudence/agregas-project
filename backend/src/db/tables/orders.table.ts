import {
  pgTable,
  serial,
  integer,
  varchar,
  decimal,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { orderStatusEnum } from "../enums";
import { users } from "./users.table";
import { retailers } from "./retailers.table";
import { products } from "./products.table";

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    customer_id: integer("customer_id")
      .notNull()
      .references(() => users.id),
    retailer_id: integer("retailer_id")
      .notNull()
      .references(() => retailers.id),
    product_id: integer("product_id")
      .notNull()
      .references(() => products.id),
    status: orderStatusEnum("status").notNull().default("pending"),
    quantity: integer("quantity").notNull(),
    brand: varchar("brand", { length: 100 }).notNull(),
    unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    total_price: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    rebate_amount: decimal("rebate_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    final_price: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
    delivery_time: varchar("delivery_time", { length: 50 }),
    delivery_address: text("delivery_address"),
    payment_method: varchar("payment_method", { length: 50 }),
    payment_status: varchar("payment_status", { length: 20 }).default("pending"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdIdx: index("orders_customer_id_idx").on(table.customer_id),
    retailerIdIdx: index("orders_retailer_id_idx").on(table.retailer_id),
    statusIdx: index("orders_status_idx").on(table.status),
    createdAtIdx: index("orders_created_at_idx").on(table.created_at),
  })
);