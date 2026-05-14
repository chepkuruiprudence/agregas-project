import {
  pgTable,
  serial,
  integer,
  varchar,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.table";

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    event_type: varchar("event_type", { length: 100 }).notNull(),
    user_id: integer("user_id").references(() => users.id),
    metadata: jsonb("metadata"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    eventTypeIdx: index("analytics_events_event_type_idx").on(table.event_type),
    userIdIdx: index("analytics_events_user_id_idx").on(table.user_id),
    createdAtIdx: index("analytics_events_created_at_idx").on(table.created_at),
  })
);