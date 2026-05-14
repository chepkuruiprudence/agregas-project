import { relations } from "drizzle-orm";
import { loyaltyPoints } from "../tables";
import { users, orders } from "../tables";

export const loyaltyPointsRelations = relations(loyaltyPoints, ({ one }) => ({
  customer: one(users, {
    fields: [loyaltyPoints.customer_id],
    references: [users.id],
  }),
  earnedFrom: one(orders, {
    fields: [loyaltyPoints.earned_from_order_id],
    references: [orders.id],
  }),
  redeemedFor: one(orders, {
    fields: [loyaltyPoints.redeemed_for_order_id],
    references: [orders.id],
  }),
}));