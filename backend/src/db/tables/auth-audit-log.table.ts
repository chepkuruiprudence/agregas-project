// backend/src/db/tables/auth-audit-log.table.ts

import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { users } from "./index.js";

export const authAuditLog = pgTable("auth_audit_log", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  email: varchar("email", { length: 255 }),
  event_type: varchar("event_type", { length: 50 }).notNull(), // signup, login, otp_verify, password_reset, passkey_register
  status: varchar("status", { length: 20 }).notNull(), // success, failed
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: varchar("user_agent", { length: 500 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type AuthAuditLog = typeof authAuditLog.$inferSelect;
export type NewAuthAuditLog = typeof authAuditLog.$inferInsert;