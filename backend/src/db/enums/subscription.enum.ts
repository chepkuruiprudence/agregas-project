import { pgEnum } from "drizzle-orm/pg-core";

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "basic",
  "standard",
  "premium",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "paused",
  "cancelled",
  "expired",
]);