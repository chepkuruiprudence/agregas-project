import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class BrandService {
  async getBrandProducts(brand: string) {
    try {
      const products = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.brand, brand));

      return products;
    } catch (error) {
      throw error;
    }
  }

  async setBasePrice(productId: number, newPrice: number) {
    try {
      const updated = await db
        .update(schema.products)
        .set({ base_price: newPrice.toString() })
        .where(eq(schema.products.id, productId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "Product not found");
      }

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  async getBrandRetailers(brand: string) {
    try {
      const retailers = await db
        .select()
        .from(schema.retailers)
        .where(eq(schema.retailers.brand, brand));

      return retailers;
    } catch (error) {
      throw error;
    }
  }

  async getBrandAnalytics(brand: string) {
    try {
      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.brand, brand));

      const totalSales = orders.length;
      const totalRevenue = orders.reduce(
        (sum, order) => sum + parseFloat(order.final_price),
        0
      );

      const retailers = await this.getBrandRetailers(brand);

      return {
        brand,
        totalSales,
        totalRevenue,
        averageSaleValue: totalRevenue / totalSales,
        activeRetailers: retailers.length,
      };
    } catch (error) {
      throw error;
    }
  }
}

export const brandService = new BrandService();