import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql", // ✨ Modern versions use 'dialect' instead of 'driver'
  dbCredentials: {
    url: process.env.DATABASE_URL!, // ✨ Modern versions use 'url' instead of 'connectionString'
  },
  verbose: true,
  strict: true,
});