import { pgEnum } from "drizzle-orm/pg-core";

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "in_transit",
  "delivered",
  "failed",
]);