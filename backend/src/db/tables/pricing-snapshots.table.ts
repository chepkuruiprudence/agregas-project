import {
  pgTable,
  serial,
  varchar,
  integer,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const pricingSnapshots = pgTable(
  "pricing_snapshots",
  {
    id: serial("id").primaryKey(),
    brand: varchar("brand", { length: 100 }).notNull(),
    cylinder_size: varchar("cylinder_size", { length: 50 }).notNull(),
    supply_kg: integer("supply_kg").notNull(),
    demand_kg: integer("demand_kg").notNull(),
    supply_demand_ratio: decimal("supply_demand_ratio", {
      precision: 5,
      scale: 3,
    }).notNull(),
    price_per_kg: decimal("price_per_kg", { precision: 10, scale: 2 }).notNull(),
    base_price_per_kg: decimal("base_price_per_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    rebate_percentage: decimal("rebate_percentage", {
      precision: 5,
      scale: 2,
    }).notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdx: index("pricing_snapshots_brand_idx").on(table.brand),
    timestampIdx: index("pricing_snapshots_timestamp_idx").on(table.timestamp),
  })
);