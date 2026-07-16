import { pgTable, uuid, varchar, integer, decimal, timestamp } from 'drizzle-orm/pg-core';
import { retailers } from './retailers.table';

export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  retailer_id: integer('retailer_id')
    .notNull()
    .references(() => retailers.id, { onDelete: 'cascade' }),
  product_name: varchar('product_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(), // cylinder, kg, liter, carton
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});