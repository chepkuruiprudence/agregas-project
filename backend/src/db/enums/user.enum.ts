import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "retailer",
  "brand",
  "admin",
]);