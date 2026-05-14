import { relations } from "drizzle-orm";
import { analyticsEvents } from "../tables";
import { users } from "../tables";

export const analyticsEventsRelations = relations(
  analyticsEvents,
  ({ one }) => ({
    user: one(users, {
      fields: [analyticsEvents.user_id],
      references: [users.id],
    }),
  })
);