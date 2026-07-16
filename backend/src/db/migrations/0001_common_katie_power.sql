CREATE TABLE "ledger_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" varchar(100) NOT NULL,
	"order_id" integer NOT NULL,
	"debit_wallet_id" integer NOT NULL,
	"credit_wallet_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'KES' NOT NULL,
	"entry_type" varchar(50) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" integer,
	"status" varchar(20) DEFAULT 'posted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "settlement_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_number" integer NOT NULL,
	"cycle_start" timestamp with time zone NOT NULL,
	"cycle_end" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"total_gross_value" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_net_value" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone,
	CONSTRAINT "settlement_cycles_cycle_number_unique" UNIQUE("cycle_number")
);
--> statement-breakpoint
CREATE TABLE "settlement_obligations" (
	"id" serial PRIMARY KEY NOT NULL,
	"settlement_cycle_id" integer NOT NULL,
	"from_wallet_id" integer NOT NULL,
	"to_wallet_id" integer NOT NULL,
	"gross_receivable" numeric(15, 2) DEFAULT '0' NOT NULL,
	"gross_payable" numeric(15, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"direction" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reference_number" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wallet_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"balance" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'KES' NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"owner_type" varchar(50) NOT NULL,
	"wallet_type" varchar(50) NOT NULL,
	"currency" varchar(10) DEFAULT 'KES' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_user_id" varchar(255) NOT NULL,
	"email" varchar(255),
	"display_name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_provider_user" UNIQUE("provider","provider_user_id")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(500) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" varchar(255) NOT NULL,
	"otp_code" varchar(6) NOT NULL,
	"otp_attempts" integer DEFAULT 0,
	"otp_expires_at" timestamp with time zone NOT NULL,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "email_verifications_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retailer_id" integer NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(500) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "passkeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"credential_id" varchar(500) NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0,
	"transports" varchar(100),
	"device_name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "passkeys_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "auth_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" varchar(255),
	"event_type" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "retailers" ADD COLUMN "business_license" varchar(255) DEFAULT 'Pending';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_debit_wallet_id_wallets_id_fk" FOREIGN KEY ("debit_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_credit_wallet_id_wallets_id_fk" FOREIGN KEY ("credit_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_obligations" ADD CONSTRAINT "settlement_obligations_settlement_cycle_id_settlement_cycles_id_fk" FOREIGN KEY ("settlement_cycle_id") REFERENCES "public"."settlement_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_obligations" ADD CONSTRAINT "settlement_obligations_from_wallet_id_wallets_id_fk" FOREIGN KEY ("from_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_obligations" ADD CONSTRAINT "settlement_obligations_to_wallet_id_wallets_id_fk" FOREIGN KEY ("to_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_snapshots" ADD CONSTRAINT "wallet_snapshots_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_log" ADD CONSTRAINT "auth_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ledger_transaction_id_idx" ON "ledger_entries" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "ledger_order_id_idx" ON "ledger_entries" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "ledger_debit_wallet_idx" ON "ledger_entries" USING btree ("debit_wallet_id");--> statement-breakpoint
CREATE INDEX "ledger_credit_wallet_idx" ON "ledger_entries" USING btree ("credit_wallet_id");--> statement-breakpoint
CREATE INDEX "ledger_status_idx" ON "ledger_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ledger_created_at_idx" ON "ledger_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "settlement_cycles_number_idx" ON "settlement_cycles" USING btree ("cycle_number");--> statement-breakpoint
CREATE INDEX "settlement_cycles_status_idx" ON "settlement_cycles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "settlement_cycles_start_idx" ON "settlement_cycles" USING btree ("cycle_start");--> statement-breakpoint
CREATE INDEX "settlement_obligations_cycle_idx" ON "settlement_obligations" USING btree ("settlement_cycle_id");--> statement-breakpoint
CREATE INDEX "settlement_obligations_from_idx" ON "settlement_obligations" USING btree ("from_wallet_id");--> statement-breakpoint
CREATE INDEX "settlement_obligations_to_idx" ON "settlement_obligations" USING btree ("to_wallet_id");--> statement-breakpoint
CREATE INDEX "settlement_obligations_status_idx" ON "settlement_obligations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wallet_snapshots_wallet_idx" ON "wallet_snapshots" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "wallet_snapshots_at_idx" ON "wallet_snapshots" USING btree ("snapshot_at");--> statement-breakpoint
CREATE INDEX "wallets_owner_id_idx" ON "wallets" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "wallets_owner_type_idx" ON "wallets" USING btree ("owner_type");--> statement-breakpoint
CREATE INDEX "wallets_status_idx" ON "wallets" USING btree ("status");