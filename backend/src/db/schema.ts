import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// ENUM TYPES
// ============================================

// User roles
export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "retailer",
  "brand_marketer",
  "admin",
]);

// Order status
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "in_delivery",
  "delivered",
  "cancelled",
]);

// Subscription tier
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "basic",
  "standard",
  "premium",
]);

// Subscription status
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "paused",
  "cancelled",
  "expired",
]);

// Retailer tier
export const retailerTierEnum = pgEnum("retailer_tier", [
  "autogas",
  "retail",
  "institutional",
]);

// Delivery status
export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "in_transit",
  "delivered",
  "failed",
]);

// Notification type
export const notificationTypeEnum = pgEnum("notification_type", [
  "order_update",
  "price_alert",
  "subscription_reminder",
  "loyalty_earned",
  "cgc_earned",
  "payment_due",
  "system_alert",
]);

// ============================================
// TABLE 1: USERS
// ============================================
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    full_name: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    role: userRoleEnum("role").notNull().default("customer"),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    roleIdx: index("users_role_idx").on(table.role),
  })
);

// ============================================
// TABLE 2: RETAILERS
// ============================================
export const retailers = pgTable(
  "retailers",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id),
    business_name: varchar("business_name", { length: 255 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    address: text("address").notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    brand: varchar("brand", { length: 100 }).notNull(), // e.g., "Salit Gas", "Hulas", "Rubis"
    stock_quantity: integer("stock_quantity").notNull().default(0), // in kg
    cylinder_size: varchar("cylinder_size", { length: 50 }).notNull(), // e.g., "6kg", "13kg", "50kg"
    tier: retailerTierEnum("tier").notNull(), // autogas, retail, institutional
    rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("0"), // 0-5 stars
    total_reviews: integer("total_reviews").notNull().default(0),
    is_verified: boolean("is_verified").notNull().default(false),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index("retailers_user_id_idx").on(table.user_id),
    tierIdx: index("retailers_tier_idx").on(table.tier),
    locationIdx: index("retailers_location_idx").on(
      table.latitude,
      table.longitude
    ),
  })
);

// ============================================
// TABLE 3: PRODUCTS
// ============================================
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    brand: varchar("brand", { length: 100 }).notNull(), // e.g., "Salit Gas", "Hulas"
    cylinder_size: varchar("cylinder_size", { length: 50 }).notNull(), // e.g., "6kg", "13kg"
    base_price: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // KES
    description: text("description"),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdx: index("products_brand_idx").on(table.brand),
    cylinderSizeIdx: index("products_cylinder_size_idx").on(table.cylinder_size),
  })
);

// ============================================
// TABLE 4: ORDERS
// ============================================
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    customer_id: integer("customer_id")
      .notNull()
      .references(() => users.id),
    retailer_id: integer("retailer_id")
      .notNull()
      .references(() => retailers.id),
    product_id: integer("product_id")
      .notNull()
      .references(() => products.id),
    status: orderStatusEnum("status").notNull().default("pending"),
    quantity: integer("quantity").notNull(), // in kg
    brand: varchar("brand", { length: 100 }).notNull(), // denormalized for quick access
    unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // price per kg at time of order
    total_price: decimal("total_price", { precision: 10, scale: 2 }).notNull(), // quantity * unit_price
    rebate_amount: decimal("rebate_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"), // dynamic rebate
    final_price: decimal("final_price", { precision: 10, scale: 2 }).notNull(), // total_price - rebate_amount
    delivery_time: varchar("delivery_time", { length: 50 }), // e.g., "2-4 hours", "30 mins"
    delivery_address: text("delivery_address"),
    payment_method: varchar("payment_method", { length: 50 }), // "mpesa", "card", "cash"
    payment_status: varchar("payment_status", { length: 20 }).default("pending"), // "pending", "completed", "failed"
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdIdx: index("orders_customer_id_idx").on(table.customer_id),
    retailerIdIdx: index("orders_retailer_id_idx").on(table.retailer_id),
    statusIdx: index("orders_status_idx").on(table.status),
    createdAtIdx: index("orders_created_at_idx").on(table.created_at),
  })
);

// ============================================
// TABLE 5: SUBSCRIPTIONS
// ============================================
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    customer_id: integer("customer_id")
      .notNull()
      .references(() => users.id),
    tier: subscriptionTierEnum("tier").notNull(), // basic, standard, premium
    deposit_amount: decimal("deposit_amount", { precision: 10, scale: 2 })
      .notNull(), // initial deposit (KES)
    current_balance: decimal("current_balance", { precision: 10, scale: 2 })
      .notNull(), // remaining balance in subscription
    rollover_percentage: integer("rollover_percentage").notNull().default(50), // % of unused balance that rolls over
    rollover_amount: decimal("rollover_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"), // actual rollover amount
    expiry_date: timestamp("expiry_date", { withTimezone: true }).notNull(),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdIdx: index("subscriptions_customer_id_idx").on(table.customer_id),
    statusIdx: index("subscriptions_status_idx").on(table.status),
    expiryDateIdx: index("subscriptions_expiry_date_idx").on(table.expiry_date),
  })
);

// ============================================
// TABLE 6: LOYALTY POINTS
// ============================================
export const loyaltyPoints = pgTable(
  "loyalty_points",
  {
    id: serial("id").primaryKey(),
    customer_id: integer("customer_id")
      .notNull()
      .references(() => users.id),
    points: integer("points").notNull().default(0), // total points available
    earned_at: timestamp("earned_at", { withTimezone: true }), // when points were earned
    earned_from_order_id: integer("earned_from_order_id").references(
      () => orders.id
    ), // which order generated these points
    redeemed_at: timestamp("redeemed_at", { withTimezone: true }), // when points were redeemed
    redeemed_for_order_id: integer("redeemed_for_order_id").references(
      () => orders.id
    ), // which order used the points
    redemption_value: decimal("redemption_value", { precision: 10, scale: 2 }), // KES value of redeemed points
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdIdx: index("loyalty_points_customer_id_idx").on(table.customer_id),
    earnedAtIdx: index("loyalty_points_earned_at_idx").on(table.earned_at),
  })
);

// ============================================
// TABLE 7: CGC TOKENS (Carbon Gas Credits)
// ============================================
export const cgcTokens = pgTable(
  "cgc_tokens",
  {
    id: serial("id").primaryKey(),
    customer_id: integer("customer_id")
      .notNull()
      .references(() => users.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // KES value of carbon credits
    earned_at: timestamp("earned_at", { withTimezone: true }), // when credits were earned
    earned_from_order_id: integer("earned_from_order_id").references(
      () => orders.id
    ), // which order generated these credits
    redeemed_at: timestamp("redeemed_at", { withTimezone: true }), // when credits were redeemed
    redeemed_for_order_id: integer("redeemed_for_order_id").references(
      () => orders.id
    ), // which order used the credits
    redemption_amount: decimal("redemption_amount", { precision: 10, scale: 2 }), // KES value redeemed
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdIdx: index("cgc_tokens_customer_id_idx").on(table.customer_id),
    earnedAtIdx: index("cgc_tokens_earned_at_idx").on(table.earned_at),
  })
);

// ============================================
// TABLE 8: GAS CREDIT (Buy Now Pay Later)
// ============================================
export const gasCredit = pgTable(
  "gas_credit",
  {
    id: serial("id").primaryKey(),
    customer_id: integer("customer_id")
      .notNull()
      .references(() => users.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // total credit approved (KES)
    interest_rate: decimal("interest_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"), // CBR + percentage
    status: varchar("status", { length: 20 }).notNull().default("active"), // "active", "repaid", "defaulted"
    repayment_balance: decimal("repayment_balance", { precision: 10, scale: 2 })
      .notNull(), // remaining amount to repay
    repayment_schedule: jsonb("repayment_schedule"), // structured repayment plan
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdIdx: index("gas_credit_customer_id_idx").on(table.customer_id),
    statusIdx: index("gas_credit_status_idx").on(table.status),
  })
);

// ============================================
// TABLE 9: NOTIFICATIONS
// ============================================
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    related_order_id: integer("related_order_id").references(() => orders.id), // optional link to order
    is_read: boolean("is_read").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.user_id),
    typeIdx: index("notifications_type_idx").on(table.type),
    isReadIdx: index("notifications_is_read_idx").on(table.is_read),
  })
);

// ============================================
// TABLE 10: PRICING SNAPSHOTS
// ============================================
export const pricingSnapshots = pgTable(
  "pricing_snapshots",
  {
    id: serial("id").primaryKey(),
    brand: varchar("brand", { length: 100 }).notNull(),
    cylinder_size: varchar("cylinder_size", { length: 50 }).notNull(),
    supply_kg: integer("supply_kg").notNull(), // available supply in kg
    demand_kg: integer("demand_kg").notNull(), // current demand in kg
    supply_demand_ratio: decimal("supply_demand_ratio", {
      precision: 5,
      scale: 3,
    }).notNull(), // for dynamic pricing algorithm
    price_per_kg: decimal("price_per_kg", { precision: 10, scale: 2 }).notNull(),
    base_price_per_kg: decimal("base_price_per_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    rebate_percentage: decimal("rebate_percentage", {
      precision: 5,
      scale: 2,
    }).notNull(), // 0-100%
    timestamp: timestamp("timestamp", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdx: index("pricing_snapshots_brand_idx").on(table.brand),
    timestampIdx: index("pricing_snapshots_timestamp_idx").on(table.timestamp),
  })
);

// ============================================
// TABLE 11: DELIVERY TRACKING
// ============================================
export const deliveryTracking = pgTable(
  "delivery_tracking",
  {
    id: serial("id").primaryKey(),
    order_id: integer("order_id")
      .notNull()
      .references(() => orders.id),
    status: deliveryStatusEnum("status").notNull().default("pending"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    current_address: text("current_address"), // dispatcher's current location description
    estimated_arrival_time: timestamp("estimated_arrival_time", {
      withTimezone: true,
    }),
    actual_delivery_time: timestamp("actual_delivery_time", {
      withTimezone: true,
    }),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("delivery_tracking_order_id_idx").on(table.order_id),
    statusIdx: index("delivery_tracking_status_idx").on(table.status),
    updatedAtIdx: index("delivery_tracking_updated_at_idx").on(
      table.updated_at
    ),
  })
);

// ============================================
// TABLE 12: ANALYTICS EVENTS
// ============================================
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    event_type: varchar("event_type", { length: 100 }).notNull(), // e.g., "user_signup", "order_placed", "price_viewed"
    user_id: integer("user_id").references(() => users.id),
    metadata: jsonb("metadata"), // flexible data structure for event-specific info
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    eventTypeIdx: index("analytics_events_event_type_idx").on(table.event_type),
    userIdIdx: index("analytics_events_user_id_idx").on(table.user_id),
    createdAtIdx: index("analytics_events_created_at_idx").on(table.created_at),
  })
);

// ============================================
// RELATIONS (for type safety)
// ============================================
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

export const retailersRelations = relations(retailers, ({ one, many }) => ({
  user: one(users, {
    fields: [retailers.user_id],
    references: [users.id],
  }),
  orders: many(orders),
}));

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

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one }) => ({
    customer: one(users, {
      fields: [subscriptions.customer_id],
      references: [users.id],
    }),
  })
);

export const loyaltyPointsRelations = relations(loyaltyPoints, ({ one }) => ({
  customer: one(users, {
    fields: [loyaltyPoints.customer_id],
    references: [users.id],
  }),
  earnedFrom: one(orders, {
    fields: [loyaltyPoints.earned_from_order_id],
    references: [orders.id],
  }),
  redeemedFor: one(orders, {
    fields: [loyaltyPoints.redeemed_for_order_id],
    references: [orders.id],
  }),
}));

export const cgcTokensRelations = relations(cgcTokens, ({ one }) => ({
  customer: one(users, {
    fields: [cgcTokens.customer_id],
    references: [users.id],
  }),
  earnedFrom: one(orders, {
    fields: [cgcTokens.earned_from_order_id],
    references: [orders.id],
  }),
  redeemedFor: one(orders, {
    fields: [cgcTokens.redeemed_for_order_id],
    references: [orders.id],
  }),
}));

export const gasCreditRelations = relations(gasCredit, ({ one }) => ({
  customer: one(users, {
    fields: [gasCredit.customer_id],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(
  notifications,
  ({ one }) => ({
    user: one(users, {
      fields: [notifications.user_id],
      references: [users.id],
    }),
    relatedOrder: one(orders, {
      fields: [notifications.related_order_id],
      references: [orders.id],
    }),
  })
);

export const deliveryTrackingRelations = relations(
  deliveryTracking,
  ({ one }) => ({
    order: one(orders, {
      fields: [deliveryTracking.order_id],
      references: [orders.id],
    }),
  })
);

export const analyticsEventsRelations = relations(
  analyticsEvents,
  ({ one }) => ({
    user: one(users, {
      fields: [analyticsEvents.user_id],
      references: [users.id],
    }),
  })
);