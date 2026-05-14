import {
  pgTable,
  serial,
  varchar,
  decimal,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    brand: varchar("brand", { length: 100 }).notNull(),
    cylinder_size: varchar("cylinder_size", { length: 50 }).notNull(),
    base_price: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
    description: text("description"),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdx: index("products_brand_idx").on(table.brand),
    cylinderSizeIdx: index("products_cylinder_size_idx").on(table.cylinder_size),
  })
);