// backend/src/db/tables/brands.table.ts

import { pgTable, uuid, varchar, text, timestamp, boolean, decimal } from 'drizzle-orm/pg-core';

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  logo_url: varchar('logo_url', { length: 500 }),
  website: varchar('website', { length: 500 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  country: varchar('country', { length: 100 }),
  registration_number: varchar('registration_number', { length: 100 }).unique(),
  tax_id: varchar('tax_id', { length: 100 }).unique(),
  is_verified: boolean('is_verified').default(false),
  total_reviews: decimal('total_reviews', { precision: 10, scale: 0 }).default('0'),
  average_rating: decimal('average_rating', { precision: 3, scale: 1 }).default('0.0'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export type Brand = typeof brands.$inferSelect;
export type BrandInsert = typeof brands.$inferInsert;