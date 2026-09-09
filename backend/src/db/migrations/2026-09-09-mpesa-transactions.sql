-- 2026-09-09: Payment confirmation restructure
-- Tracks STK Push initiations so Safaricom callbacks (which only echo
-- CheckoutRequestID) can be correlated to orders, receipts stored, and
-- duplicate callbacks ignored.

CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  phone_number VARCHAR(20) NOT NULL,
  amount VARCHAR(20) NOT NULL,
  merchant_request_id VARCHAR(100),
  checkout_request_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'initiated', -- initiated|success|failed|cancelled|timeout
  result_code VARCHAR(20),
  result_desc TEXT,
  mpesa_receipt_number VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mpesa_transactions_order_id_idx ON mpesa_transactions (order_id);
CREATE INDEX IF NOT EXISTS mpesa_transactions_checkout_idx ON mpesa_transactions (checkout_request_id);
CREATE INDEX IF NOT EXISTS mpesa_transactions_merchant_idx ON mpesa_transactions (merchant_request_id);
CREATE INDEX IF NOT EXISTS mpesa_transactions_status_idx ON mpesa_transactions (status);
