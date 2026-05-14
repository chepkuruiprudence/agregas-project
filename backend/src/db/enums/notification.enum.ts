import { pgEnum } from "drizzle-orm/pg-core";

export const notificationTypeEnum = pgEnum("notification_type", [
  "order_update",
  "price_alert",
  "subscription_reminder",
  "loyalty_earned",
  "cgc_earned",
  "payment_due",
  "system_alert",
]);