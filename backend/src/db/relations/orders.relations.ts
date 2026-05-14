import { relations } from "drizzle-orm";
import { orders } from "../tables";
import { users, retailers, products, deliveryTracking } from "../tables";

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customer_id],
    references: [users.id],
  }),
  retailer: one(retailers, {
    fields: [orders.retailer_id],
    references: [retailers.id],
  }),
  product: one(products, {
    fields: [orders.product_id],
    references: [products.id],
  }),
  deliveryTracking: one(deliveryTracking, {
    fields: [orders.id],
    references: [deliveryTracking.order_id],
  }),
}));