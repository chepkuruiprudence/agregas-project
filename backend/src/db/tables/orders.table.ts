// backend/src/db/tables/orders.table.ts
// ✅ CORRECTED: Includes retailer_id + brand + cylinder_size, removed product_id

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

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    
    // 🔑 CUSTOMER & RETAILER
    customer_id: integer("customer_id")
      .notNull()
      .references(() => users.id),
    retailer_id: integer("retailer_id")
      .notNull()
      .references(() => retailers.id),
    // ✅ IMPORTANT: retailer_id tells us WHERE the order is fulfilled from!
    
    // 📦 PRODUCT DETAILS (stored for order history)
    brand: varchar("brand", { length: 100 }).notNull(),
    cylinder_size: varchar("cylinder_size", { length: 50 }).notNull(),
    quantity: integer("quantity").notNull(),
    
    // 💰 PRICING
    unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    total_price: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    rebate_amount: decimal("rebate_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    final_price: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
    
    // 📍 DELIVERY
    delivery_latitude: decimal("delivery_latitude", { precision: 10, scale: 8 }),
    delivery_longitude: decimal("delivery_longitude", { precision: 11, scale: 8 }),
    delivery_address: text("delivery_address"),
    delivery_time: varchar("delivery_time", { length: 50 }),
    
    // 💳 PAYMENT
    payment_method: varchar("payment_method", { length: 50 }), // M-Pesa, Card, Cash
    payment_status: varchar("payment_status", { length: 20 }).default("pending"),
    
    // 📊 STATUS
    status: orderStatusEnum("status").notNull().default("pending"),
    
    // ⏰ TIMESTAMPS
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
    brandIdx: index("orders_brand_idx").on(table.brand),
  })
);

export type Order = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;

/**
 * KEY CHANGES FROM OLD SCHEMA:
 * ✅ retailer_id: Now we know which retailer fulfills this order
 * ✅ brand: Product name (SafeGas, ProGas)
 * ✅ cylinder_size: Product size (6kg, 13kg)
 * ❌ product_id: Removed (not needed with brand + size)
 * 
 * FLOW:
 * 1. Customer at location X
 * 2. Find nearest retailer Y
 * 3. Show retailer Y's inventory of brands/sizes
 * 4. Customer selects SafeGas 6kg
 * 5. Create order with:
 *    - customer_id: customer X
 *    - retailer_id: retailer Y (WHICH RETAILER!)
 *    - brand: "SafeGas"
 *    - cylinder_size: "6kg"
 *    - quantity: 3
 *    - unit_price: from retail_inventory where retailer_id=Y
 * 6. Deduct from retail_inventory where retailer_id=Y AND brand=SafeGas AND size=6kg
 */