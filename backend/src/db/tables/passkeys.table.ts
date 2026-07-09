// backend/src/db/tables/passkeys.table.ts

import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./index.js";

export const passkeys = pgTable("passkeys", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  credential_id: varchar("credential_id", { length: 500 }).notNull().unique(),
  public_key: text("public_key").notNull(),
  counter: integer("counter").default(0),
  transports: varchar("transports", { length: 100 }),
  device_name: varchar("device_name", { length: 255 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Passkey = typeof passkeys.$inferSelect;
export type NewPasskey = typeof passkeys.$inferInsert;