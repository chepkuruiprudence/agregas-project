// db/tables/finance.ts
import {
  pgTable,
  serial,
  integer,
  varchar,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.table"; 
import { orders } from "./orders.table";

/**
 * WALLETS
 * One wallet per participant (customer, retailer, OMC, AGREGAS, escrow)
 * Balance = SUM(credits) - SUM(debits) calculated dynamically from ledger
 */
export const wallets = pgTable(
  "wallets",
  {
    id: serial("id").primaryKey(),
    owner_id: integer("owner_id").notNull().references(() => users.id),
    owner_type: varchar("owner_type", { length: 50 }).notNull(), // "customer", "retailer", "OMC", "AGREGAS"
    wallet_type: varchar("wallet_type", { length: 50 }).notNull(), // "operating", "settlement", "escrow"
    currency: varchar("currency", { length: 10 }).notNull().default("KES"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ownerIdIdx: index("wallets_owner_id_idx").on(table.owner_id),
    ownerTypeIdx: index("wallets_owner_type_idx").on(table.owner_type),
    statusIdx: index("wallets_status_idx").on(table.status),
  })
);

/**
 * LEDGER_ENTRIES
 * Immutable transaction log
 * Double-entry engine: debit + credit balance tracking
 */
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: serial("id").primaryKey(),
    transaction_id: varchar("transaction_id", { length: 100 }).notNull().unique(),
    order_id: integer("order_id").notNull().references(() => orders.id),
    
    debit_wallet_id: integer("debit_wallet_id").notNull().references(() => wallets.id),
    credit_wallet_id: integer("credit_wallet_id").notNull().references(() => wallets.id),
    
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("KES"),
    
    entry_type: varchar("entry_type", { length: 50 }).notNull(), 
    reference_type: varchar("reference_type", { length: 50 }), 
    reference_id: integer("reference_id"), 
    
    status: varchar("status", { length: 20 }).notNull().default("posted"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    transactionIdIdx: index("ledger_transaction_id_idx").on(table.transaction_id),
    orderIdIdx: index("ledger_order_id_idx").on(table.order_id),
    debitWalletIdx: index("ledger_debit_wallet_idx").on(table.debit_wallet_id),
    creditWalletIdx: index("ledger_credit_wallet_idx").on(table.credit_wallet_id),
    statusIdx: index("ledger_status_idx").on(table.status),
    createdAtIdx: index("ledger_created_at_idx").on(table.created_at),
  })
);

/**
 * SETTLEMENT_CYCLES
 * Groups transactions for daily or weekly net-payout periods
 */
export const settlementCycles = pgTable(
  "settlement_cycles",
  {
    id: serial("id").primaryKey(),
    cycle_number: integer("cycle_number").notNull().unique(),
    cycle_start: timestamp("cycle_start", { withTimezone: true }).notNull(),
    cycle_end: timestamp("cycle_end", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("open"),
    
    total_gross_value: decimal("total_gross_value", { precision: 15, scale: 2 }).notNull().default("0"),
    total_net_value: decimal("total_net_value", { precision: 15, scale: 2 }).notNull().default("0"),
    
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    settled_at: timestamp("settled_at", { withTimezone: true }),
  },
  (table) => ({
    cycleNumberIdx: index("settlement_cycles_number_idx").on(table.cycle_number),
    statusIdx: index("settlement_cycles_status_idx").on(table.status),
    cycleStartIdx: index("settlement_cycles_start_idx").on(table.cycle_start),
  })
);

/**
 * SETTLEMENT_OBLIGATIONS
 * Net positions calculated upon closing out cycle batches
 */
export const settlementObligations = pgTable(
  "settlement_obligations",
  {
    id: serial("id").primaryKey(),
    settlement_cycle_id: integer("settlement_cycle_id").notNull().references(() => settlementCycles.id),
    
    from_wallet_id: integer("from_wallet_id").notNull().references(() => wallets.id),
    to_wallet_id: integer("to_wallet_id").notNull().references(() => wallets.id),
    
    gross_receivable: decimal("gross_receivable", { precision: 15, scale: 2 }).notNull().default("0"),
    gross_payable: decimal("gross_payable", { precision: 15, scale: 2 }).notNull().default("0"),
    
    net_amount: decimal("net_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    direction: varchar("direction", { length: 20 }).notNull(), 
    
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    reference_number: varchar("reference_number", { length: 100 }),
    
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    settled_at: timestamp("settled_at", { withTimezone: true }),
  },
  (table) => ({
    settlementCycleIdx: index("settlement_obligations_cycle_idx").on(table.settlement_cycle_id),
    fromWalletIdx: index("settlement_obligations_from_idx").on(table.from_wallet_id),
    toWalletIdx: index("settlement_obligations_to_idx").on(table.to_wallet_id),
    statusIdx: index("settlement_obligations_status_idx").on(table.status),
  })
);

/**
 * WALLET_SNAPSHOTS
 * Cache balances at defined milestones to boost query runtime speeds
 */
export const walletSnapshots = pgTable(
  "wallet_snapshots",
  {
    id: serial("id").primaryKey(),
    wallet_id: integer("wallet_id").notNull().references(() => wallets.id),
    balance: decimal("balance", { precision: 15, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("KES"),
    snapshot_at: timestamp("snapshot_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    walletIdIdx: index("wallet_snapshots_wallet_idx").on(table.wallet_id),
    snapshotAtIdx: index("wallet_snapshots_at_idx").on(table.snapshot_at),
  })
);