DO $$ BEGIN
 CREATE TYPE "delivery_status" AS ENUM('pending', 'in_transit', 'delivered', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "notification_type" AS ENUM('order_update', 'price_alert', 'subscription_reminder', 'loyalty_earned', 'cgc_earned', 'payment_due', 'system_alert');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "order_status" AS ENUM('pending', 'confirmed', 'processing', 'in_delivery', 'delivered', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "retailer_tier" AS ENUM('autogas', 'retail', 'institutional');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "subscription_status" AS ENUM('active', 'paused', 'cancelled', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "subscription_tier" AS ENUM('basic', 'standard', 'premium');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('customer', 'retailer', 'brand_marketer', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"user_id" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cgc_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"earned_at" timestamp with time zone,
	"earned_from_order_id" integer,
	"redeemed_at" timestamp with time zone,
	"redeemed_for_order_id" integer,
	"redemption_amount" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"current_address" text,
	"estimated_arrival_time" timestamp with time zone,
	"actual_delivery_time" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gas_credit" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"interest_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"repayment_balance" numeric(10, 2) NOT NULL,
	"repayment_schedule" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"earned_at" timestamp with time zone,
	"earned_from_order_id" integer,
	"redeemed_at" timestamp with time zone,
	"redeemed_for_order_id" integer,
	"redemption_value" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"related_order_id" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"retailer_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"quantity" integer NOT NULL,
	"brand" varchar(100) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"rebate_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"final_price" numeric(10, 2) NOT NULL,
	"delivery_time" varchar(50),
	"delivery_address" text,
	"payment_method" varchar(50),
	"payment_status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pricing_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand" varchar(100) NOT NULL,
	"cylinder_size" varchar(50) NOT NULL,
	"supply_kg" integer NOT NULL,
	"demand_kg" integer NOT NULL,
	"supply_demand_ratio" numeric(5, 3) NOT NULL,
	"price_per_kg" numeric(10, 2) NOT NULL,
	"base_price_per_kg" numeric(10, 2) NOT NULL,
	"rebate_percentage" numeric(5, 2) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand" varchar(100) NOT NULL,
	"cylinder_size" varchar(50) NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "retailers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"address" text NOT NULL,
	"phone" varchar(20) NOT NULL,
	"brand" varchar(100) NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"cylinder_size" varchar(50) NOT NULL,
	"tier" "retailer_tier" NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"tier" "subscription_tier" NOT NULL,
	"deposit_amount" numeric(10, 2) NOT NULL,
	"current_balance" numeric(10, 2) NOT NULL,
	"rollover_percentage" integer DEFAULT 50 NOT NULL,
	"rollover_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_event_type_idx" ON "analytics_events" ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_user_id_idx" ON "analytics_events" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_created_at_idx" ON "analytics_events" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cgc_tokens_customer_id_idx" ON "cgc_tokens" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cgc_tokens_earned_at_idx" ON "cgc_tokens" ("earned_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_tracking_order_id_idx" ON "delivery_tracking" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_tracking_status_idx" ON "delivery_tracking" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_tracking_updated_at_idx" ON "delivery_tracking" ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gas_credit_customer_id_idx" ON "gas_credit" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gas_credit_status_idx" ON "gas_credit" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_points_customer_id_idx" ON "loyalty_points" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_points_earned_at_idx" ON "loyalty_points" ("earned_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_customer_id_idx" ON "orders" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_retailer_id_idx" ON "orders" ("retailer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pricing_snapshots_brand_idx" ON "pricing_snapshots" ("brand");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pricing_snapshots_timestamp_idx" ON "pricing_snapshots" ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_brand_idx" ON "products" ("brand");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_cylinder_size_idx" ON "products" ("cylinder_size");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "retailers_user_id_idx" ON "retailers" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "retailers_tier_idx" ON "retailers" ("tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "retailers_location_idx" ON "retailers" ("latitude","longitude");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_customer_id_idx" ON "subscriptions" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_expiry_date_idx" ON "subscriptions" ("expiry_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cgc_tokens" ADD CONSTRAINT "cgc_tokens_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cgc_tokens" ADD CONSTRAINT "cgc_tokens_earned_from_order_id_orders_id_fk" FOREIGN KEY ("earned_from_order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cgc_tokens" ADD CONSTRAINT "cgc_tokens_redeemed_for_order_id_orders_id_fk" FOREIGN KEY ("redeemed_for_order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gas_credit" ADD CONSTRAINT "gas_credit_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_earned_from_order_id_orders_id_fk" FOREIGN KEY ("earned_from_order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_redeemed_for_order_id_orders_id_fk" FOREIGN KEY ("redeemed_for_order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_order_id_orders_id_fk" FOREIGN KEY ("related_order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "retailers" ADD CONSTRAINT "retailers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
