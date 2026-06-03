import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

/**
 * Seed products table with LPG gas products
 * Run this once to populate the database
 * 
 * Command: npx ts-node src/seeds/seed-products.ts
 */
async function seedProducts() {
  try {
    console.log('🌱 Starting products seed...');

    const products = [
      // SafeGas Products
      {
        brand: 'SafeGas',
        cylinder_size: '6kg',
        base_price: '800',
        description: 'SafeGas 6kg refill',
        is_active: true,
      },
      {
        brand: 'SafeGas',
        cylinder_size: '13kg',
        base_price: '1500',
        description: 'SafeGas 13kg refill',
        is_active: true,
      },
      {
        brand: 'SafeGas',
        cylinder_size: '50kg',
        base_price: '5000',
        description: 'SafeGas 50kg commercial',
        is_active: true,
      },

      // ProGas Products
      {
        brand: 'ProGas',
        cylinder_size: '6kg',
        base_price: '750',
        description: 'ProGas 6kg refill',
        is_active: true,
      },
      {
        brand: 'ProGas',
        cylinder_size: '13kg',
        base_price: '1450',
        description: 'ProGas 13kg refill',
        is_active: true,
      },
      {
        brand: 'ProGas',
        cylinder_size: '50kg',
        base_price: '4800',
        description: 'ProGas 50kg commercial',
        is_active: true,
      },

      // EcoGas Products
      {
        brand: 'EcoGas',
        cylinder_size: '6kg',
        base_price: '700',
        description: 'EcoGas 6kg eco-friendly',
        is_active: true,
      },
      {
        brand: 'EcoGas',
        cylinder_size: '13kg',
        base_price: '1300',
        description: 'EcoGas 13kg eco-friendly',
        is_active: true,
      },
      {
        brand: 'EcoGas',
        cylinder_size: '50kg',
        base_price: '4500',
        description: 'EcoGas 50kg commercial',
        is_active: true,
      },

      // Total Gas Products
      {
        brand: 'TotalGas',
        cylinder_size: '6kg',
        base_price: '850',
        description: 'Total Gas 6kg refill',
        is_active: true,
      },
      {
        brand: 'TotalGas',
        cylinder_size: '13kg',
        base_price: '1600',
        description: 'Total Gas 13kg refill',
        is_active: true,
      },
      {
        brand: 'TotalGas',
        cylinder_size: '50kg',
        base_price: '5200',
        description: 'Total Gas 50kg commercial',
        is_active: true,
      },

      // British Gas Products
      {
        brand: 'BritishGas',
        cylinder_size: '6kg',
        base_price: '900',
        description: 'British Gas 6kg premium',
        is_active: true,
      },
      {
        brand: 'BritishGas',
        cylinder_size: '13kg',
        base_price: '1700',
        description: 'British Gas 13kg premium',
        is_active: true,
      },
      {
        brand: 'BritishGas',
        cylinder_size: '50kg',
        base_price: '5500',
        description: 'British Gas 50kg commercial',
        is_active: true,
      },
    ];

    // Delete existing products (optional - comment out if you want to keep existing)
    // await db.delete(schema.products);

    // Insert products
    const inserted = await db
      .insert(schema.products)
      .values(products as any)
      .returning();

    console.log(`✅ Successfully seeded ${inserted.length} products`);
    console.log('📊 Products created:', inserted.map(p => `${p.brand} ${p.cylinder_size}`).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run the seed
seedProducts();