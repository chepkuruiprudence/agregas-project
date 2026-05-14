import { relations } from "drizzle-orm";
import { users } from "../tables";
import { retailers, orders, subscriptions, loyaltyPoints, cgcTokens, gasCredit, notifications, analyticsEvents } from "../tables";

export const usersRelations = relations(users, ({ one, many }) => ({
  retailer: one(retailers, {
    fields: [users.id],
    references: [retailers.user_id],
  }),
  orders: many(orders),
  subscriptions: many(subscriptions),
  loyaltyPoints: many(loyaltyPoints),
  cgcTokens: many(cgcTokens),
  gasCredit: many(gasCredit),
  notifications: many(notifications),
  analyticsEvents: many(analyticsEvents),
}));