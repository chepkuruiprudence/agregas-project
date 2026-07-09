// backend/src/db/tables/password-reset-tokens.table.ts

import { pgTable, serial, integer, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./index.js";

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 500 }).notNull().unique(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  is_used: boolean("is_used").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;