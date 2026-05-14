import { relations } from "drizzle-orm";
import { notifications } from "../tables";
import { users, orders } from "../tables";

export const notificationsRelations = relations(
  notifications,
  ({ one }) => ({
    user: one(users, {
      fields: [notifications.user_id],
      references: [users.id],
    }),
    relatedOrder: one(orders, {
      fields: [notifications.related_order_id],
      references: [orders.id],
    }),
  })
);