// db/enums/finance.ts

export const EntryType = {
  ORDER_PAYMENT: "order_payment",
  REFUND: "refund",
  REVERSAL: "reversal"
} as const;

export const ReferenceType = {
  ORDER: "order",
  SUBSCRIPTION: "subscription",
  SETTLEMENT: "settlement"
} as const;

export const LedgerStatus = {
  POSTED: "posted",
  REVERSED: "reversed"
} as const;

export const WalletStatus = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  CLOSED: "closed"
} as const;

export const CycleStatus = {
  OPEN: "open",
  CLOSED: "closed",
  SETTLED: "settled",
  CANCELLED: "cancelled"
} as const;

export const ObligationStatus = {
  PENDING: "pending",
  SETTLED: "settled",
  FAILED: "failed",
  REVERSED: "reversed"
} as const;