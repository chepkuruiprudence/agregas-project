// backend/src/db/tables/email-verifications.table.ts

import { pgTable, serial, integer, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./index.js";

export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  email: varchar("email", { length: 255 }).notNull().unique(),
  otp_code: varchar("otp_code", { length: 6 }).notNull(),
  otp_attempts: integer("otp_attempts").default(0),
  otp_expires_at: timestamp("otp_expires_at", { withTimezone: true }).notNull(),
  is_verified: boolean("is_verified").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;