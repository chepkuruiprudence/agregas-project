import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class PricingService {
  async calculatePrice(
    brand: string,
    cylinderSize: string,
    quantity: number,
    supply: number,
    demand: number
  ) {
    try {
      // Get base price
      const product = await db
        .select()
        .from(schema.products)
        .where(and(eq(schema.products.brand, brand), eq(schema.products.cylinder_size, cylinderSize)));

      if (product.length === 0) {
        throw new Error("Product not found");
      }

      const basePrice = parseFloat(product[0].base_price);
      const supplyDemandRatio = supply / demand;

      let rebatePercentage = 0;
      if (supplyDemandRatio > 1.5) rebatePercentage = 20;
      else if (supplyDemandRatio > 1) rebatePercentage = 15;
      else if (supplyDemandRatio === 1) rebatePercentage = 10;
      else if (supplyDemandRatio < 1) rebatePercentage = 0;

      const totalPrice = basePrice * quantity;
      const rebateAmount = (totalPrice * rebatePercentage) / 100;
      const finalPrice = totalPrice - rebateAmount;

      return {
        basePrice,
        totalPrice,
        rebatePercentage,
        rebateAmount,
        finalPrice,
        supplyDemandRatio,
      };
    } catch (error) {
      throw error;
    }
  }

  async getPricingSnapshot(brand: string, cylinderSize: string) {
    try {
      const snapshot = await db
        .select()
        .from(schema.pricingSnapshots)
        .where(and(eq(schema.pricingSnapshots.brand, brand), eq(schema.pricingSnapshots.cylinder_size, cylinderSize)))
        .orderBy((t) => t.timestamp)
        .limit(1);

      if (snapshot.length === 0) {
        return null;
      }

      return {
        brand: snapshot[0].brand,
        cylinderSize: snapshot[0].cylinder_size,
        supply: snapshot[0].supply_kg,
        demand: snapshot[0].demand_kg,
        pricePerKg: snapshot[0].price_per_kg,
        rebatePercentage: snapshot[0].rebate_percentage,
        timestamp: snapshot[0].timestamp,
      };
    } catch (error) {
      throw error;
    }
  }

  async recordSnapshot(
    brand: string,
    cylinderSize: string,
    supplyKg: number,
    demandKg: number,
    pricePerKg: number,
    rebatePercentage: number
  ) {
    try {
      const supplyDemandRatio = supplyKg / demandKg;

      await db.insert(schema.pricingSnapshots).values({
        brand,
        cylinder_size: cylinderSize,
        supply_kg: supplyKg,
        demand_kg: demandKg,
        supply_demand_ratio: supplyDemandRatio.toString(),
        price_per_kg: pricePerKg.toString(),
        base_price_per_kg: pricePerKg.toString(),
        rebate_percentage: rebatePercentage.toString(),
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

export const pricingService = new PricingService();