-- 2026-09-08: Align `orders` with the current Drizzle schema and introduce
-- `retail_inventory` (per-retailer stock), which the order pipeline expects.

BEGIN;

-- 1. orders: add columns the code expects
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cylinder_size varchar(50);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_latitude numeric(10, 8),
  ADD COLUMN IF NOT EXISTS delivery_longitude numeric(11, 8);

-- 2. orders: relax legacy NOT NULL constraints that block new inserts
ALTER TABLE orders ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN delivery_address DROP NOT NULL;

-- 3. orders: backfill new columns from the existing row (product 1 = SafeGas 6kg)
UPDATE orders
SET cylinder_size = (SELECT cylinder_size FROM products WHERE products.id = orders.product_id)
WHERE cylinder_size IS NULL;

-- 4. retail_inventory: create the table if it does not exist
CREATE TABLE IF NOT EXISTS retail_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id integer NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  brand varchar(255) NOT NULL,
  cylinder_size varchar(50) NOT NULL,
  quantity_available integer NOT NULL DEFAULT 0,
  price_per_unit numeric(10, 2) NOT NULL,
  last_restocked timestamp,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS retail_inventory_retailer_id_idx ON retail_inventory (retailer_id);
CREATE INDEX IF NOT EXISTS retail_inventory_brand_idx ON retail_inventory (brand);
CREATE INDEX IF NOT EXISTS retail_inventory_cylinder_size_idx ON retail_inventory (cylinder_size);
CREATE UNIQUE INDEX IF NOT EXISTS retail_inventory_unique_retailer_brand_size
  ON retail_inventory (retailer_id, brand, cylinder_size);

-- 5. retail_inventory: seed every active retailer with the full product catalog
--    so order matching succeeds. Price comes from the products table base price.
INSERT INTO retail_inventory (retailer_id, brand, cylinder_size, quantity_available, price_per_unit, last_restocked)
SELECT r.id,
       p.brand,
       p.cylinder_size,
       50,
       p.base_price,
       now()
FROM retailers r
CROSS JOIN products p
WHERE r.is_active = true
  AND p.is_active = true
ON CONFLICT (retailer_id, brand, cylinder_size) DO NOTHING;

-- 6. orders: index to match schema
CREATE INDEX IF NOT EXISTS orders_cylinder_size_idx ON orders (cylinder_size);

COMMIT;

-- Verification
SELECT 'orders columns added' AS step, COUNT(*) AS ok
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name IN ('cylinder_size', 'delivery_latitude', 'delivery_longitude');

SELECT 'retail_inventory rows seeded' AS step, COUNT(*) AS rows
FROM retail_inventory;
