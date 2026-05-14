import { relations } from "drizzle-orm";
import { deliveryTracking } from "../tables";
import { orders } from "../tables";

export const deliveryTrackingRelations = relations(
  deliveryTracking,
  ({ one }) => ({
    order: one(orders, {
      fields: [deliveryTracking.order_id],
      references: [orders.id],
    }),
  })
);