import { relations } from "drizzle-orm";
import { cgcTokens } from "../tables";
import { users, orders } from "../tables";

export const cgcTokensRelations = relations(cgcTokens, ({ one }) => ({
  customer: one(users, {
    fields: [cgcTokens.customer_id],
    references: [users.id],
  }),
  earnedFrom: one(orders, {
    fields: [cgcTokens.earned_from_order_id],
    references: [orders.id],
  }),
  redeemedFor: one(orders, {
    fields: [cgcTokens.redeemed_for_order_id],
    references: [orders.id],
  }),
}));