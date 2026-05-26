import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as dotenv from "dotenv";

// 1. Instantly pull variables into memory before the connection pool reads them
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing from environment variables!");
}

// 2. Configure the local connection engine
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// 3. Export a single, unified database transaction instance
export const db = drizzle(pool);