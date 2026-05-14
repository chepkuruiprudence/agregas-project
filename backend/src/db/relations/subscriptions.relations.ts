import { relations } from "drizzle-orm";
import { subscriptions } from "../tables";
import { users } from "../tables";

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one }) => ({
    customer: one(users, {
      fields: [subscriptions.customer_id],
      references: [users.id],
    }),
  })
);