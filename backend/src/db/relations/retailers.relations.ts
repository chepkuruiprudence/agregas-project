import { relations } from "drizzle-orm";
import { retailers } from "../tables";
import { users, orders } from "../tables";

export const retailersRelations = relations(retailers, ({ one, many }) => ({
  user: one(users, {
    fields: [retailers.user_id],
    references: [users.id],
  }),
  orders: many(orders),
}));