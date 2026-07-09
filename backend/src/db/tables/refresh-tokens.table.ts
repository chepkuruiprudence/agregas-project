// backend/src/db/tables/refresh-tokens.table.ts

import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { users } from "./index.js";

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 500 }).notNull().unique(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: varchar("user_agent", { length: 500 }),
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;