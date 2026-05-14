import { pgEnum } from "drizzle-orm/pg-core";

export const retailerTierEnum = pgEnum("retailer_tier", [
  "autogas",
  "retail",
  "institutional",
]);