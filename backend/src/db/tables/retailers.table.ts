import {
  pgTable,
  serial,
  integer,
  varchar,
  decimal,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { retailerTierEnum } from "../enums";
import { users } from "./users.table";

export const retailers = pgTable(
  "retailers",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id),
    business_name: varchar("business_name", { length: 255 }).notNull(),
    business_license: varchar("business_license", { length: 255 }).default("Pending"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    address: text("address").notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    brand: varchar("brand", { length: 100 }).notNull(),
    stock_quantity: integer("stock_quantity").notNull().default(0),
    cylinder_size: varchar("cylinder_size", { length: 50 }).notNull(),
    tier: retailerTierEnum("tier").notNull(),
    rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("0"),
    total_reviews: integer("total_reviews").notNull().default(0),
    is_verified: boolean("is_verified").notNull().default(false),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index("retailers_user_id_idx").on(table.user_id),
    tierIdx: index("retailers_tier_idx").on(table.tier),
    locationIdx: index("retailers_location_idx").on(
      table.latitude,
      table.longitude
    ),
  })
);