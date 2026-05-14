import { relations } from "drizzle-orm";
import { gasCredit } from "../tables";
import { users } from "../tables";

export const gasCreditRelations = relations(gasCredit, ({ one }) => ({
  customer: one(users, {
    fields: [gasCredit.customer_id],
    references: [users.id],
  }),
}));