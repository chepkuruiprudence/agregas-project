import {
  pgTable,
  serial,
  integer,
  decimal,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { deliveryStatusEnum } from "../enums";
import { orders } from "./orders.table";

export const deliveryTracking = pgTable(
  "delivery_tracking",
  {
    id: serial("id").primaryKey(),
    order_id: integer("order_id")
      .notNull()
      .references(() => orders.id),
    status: deliveryStatusEnum("status").notNull().default("pending"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    current_address: text("current_address"),
    estimated_arrival_time: timestamp("estimated_arrival_time", {
      withTimezone: true,
    }),
    actual_delivery_time: timestamp("actual_delivery_time", {
      withTimezone: true,
    }),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("delivery_tracking_order_id_idx").on(table.order_id),
    statusIdx: index("delivery_tracking_status_idx").on(table.status),
    updatedAtIdx: index("delivery_tracking_updated_at_idx").on(
      table.updated_at
    ),
  })
);