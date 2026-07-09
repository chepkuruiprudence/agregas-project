// backend/src/db/tables/oauth-accounts.table.ts

import { pgTable, serial, integer, varchar, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./index.js";

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(),
    provider_user_id: varchar("provider_user_id", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    display_name: varchar("display_name", { length: 255 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    unique_provider_user: unique("unique_provider_user").on(
      table.provider,
      table.provider_user_id
    ),
  })
);

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;