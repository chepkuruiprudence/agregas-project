import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler';

export class InventoryService {
  // 1. Changed retailerId type to number
  async getRetailerInventory(retailerId: number) {
    return await db
      .select()
      .from(schema.inventory)
      .where(eq(schema.inventory.retailer_id, retailerId))
      .orderBy(schema.inventory.created_at);
  }

  // 2. Changed retailerId type to number
  async addInventory(
    retailerId: number,
    productName: string,
    quantity: number,
    price: number,
    unit: string
  ) {
    try {
      const result = await db
        .insert(schema.inventory)
        .values({
          retailer_id: retailerId,
          product_name: productName,
          quantity ,
          price : price.toFixed(2),
          unit 
        })
        .returning();

      return result[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new AppError(400, 'Product already exists for this retailer');
      }
      throw error;
    }
  }

  // 3. Changed retailerId type to number
  async updateInventory(
    inventoryId: string,
    retailerId: number,
    updates: { quantity?: number; price?: number }
  ) {
    // Prepare the update payload
    const updateData: Record<string, any> = {
      ...updates,
      updated_at: new Date(),
    };

    // Convert price to a string if it was provided
    if (updates.price !== undefined) {
      updateData.price = updates.price.toFixed(2);
    }

    const result = await db
      .update(schema.inventory)
      .set(updateData)
      .where(
        and(
          eq(schema.inventory.id, inventoryId),
          eq(schema.inventory.retailer_id, retailerId)
        )
      )
      .returning();

    return result;
  }

  // 4. Changed retailerId type to number
  async deleteInventory(inventoryId: string, retailerId: number) {
    const result = await db
      .delete(schema.inventory)
      .where(
        and(
          eq(schema.inventory.id, inventoryId),
          eq(schema.inventory.retailer_id, retailerId)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new AppError(404, 'Inventory item not found');
    }

    return result[0];
  }
}

export const inventoryService = new InventoryService();
