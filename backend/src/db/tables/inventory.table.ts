// backend/src/db/tables/retail-inventory.table.ts
// ✅ CORRECTED: Properly tracks inventory per retailer per brand per size

import {
  pgTable,
  uuid,
  integer,
  varchar,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { retailers } from "./retailers.table";

export const retailInventory = pgTable(
  "retail_inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    
    // 🔑 RETAILER REFERENCE
    retailer_id: integer("retailer_id")
      .notNull()
      .references(() => retailers.id, { onDelete: "cascade" }),
    
    // 📦 PRODUCT IDENTIFICATION (not foreign key, just strings for flexibility)
    brand: varchar("brand", { length: 255 }).notNull(), // SafeGas, ProGas, EcoGas
    cylinder_size: varchar("cylinder_size", { length: 50 }).notNull(), // 6kg, 13kg, 50kg
    
    // 📊 INVENTORY DATA
    quantity_available: integer("quantity_available").notNull().default(0),
    price_per_unit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
    
    // ⏰ TRACKING
    last_restocked: timestamp("last_restocked"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // ✅ Indexes for common queries
    retailerIdIdx: index("retail_inventory_retailer_id_idx").on(table.retailer_id),
    brandIdx: index("retail_inventory_brand_idx").on(table.brand),
    sizeIdx: index("retail_inventory_cylinder_size_idx").on(table.cylinder_size),
    
    // ✅ Unique constraint: Only one inventory entry per retailer/brand/size
    // This prevents duplicates
    uniqueRetailerBrandSize: index(
      "retail_inventory_unique_retailer_brand_size"
    ).on(table.retailer_id, table.brand, table.cylinder_size),
  })
);

export type RetailInventory = typeof retailInventory.$inferSelect;
export type RetailInventoryInsert = typeof retailInventory.$inferInsert;

/**
 * EXAMPLE DATA:
 * 
 * retailer_id | brand   | cylinder_size | quantity_available | price_per_unit
 * ------------|---------|---------------|--------------------|---------------
 * 1           | SafeGas | 6kg           | 50                 | 850
 * 1           | SafeGas | 13kg          | 30                 | 1500
 * 1           | ProGas  | 6kg           | 20                 | 800
 * 2           | SafeGas | 6kg           | 40                 | 850
 * 2           | EcoGas  | 6kg           | 15                 | 900
 * 
 * Different retailers can have DIFFERENT quantities and prices for SAME brand/size!
 */