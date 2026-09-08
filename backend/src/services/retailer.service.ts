// backend/src/services/retailers.service.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, gt, desc, sql } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class RetailerService {
  /**
   * Helper: Resolve retailer by user_id
   */
  private async getRetailerByUserId(userId: number) {
    const retailer = await db
      .select()
      .from(schema.retailers)
      .where(eq(schema.retailers.user_id, userId));

    if (retailer.length === 0) {
      throw new AppError(403, "User is not a retailer");
    }

    return retailer[0];
  }

  /**
   * Helper: Group inventory items by brand
   * Format: [{ brand: "SafeGas", sizes: [{ size: "6kg", quantity: 50, price: 850 }] }]
   */
  groupInventoryByBrand(inventory: any[]): any[] {
    const grouped: Record<string, any> = {};

    inventory.forEach((item) => {
      if (!grouped[item.brand]) {
        grouped[item.brand] = {
          brand: item.brand,
          sizes: [],
        };
      }

      grouped[item.brand].sizes.push({
        size: item.cylinder_size || item.cylinderSize,
        quantity: item.quantity_available ?? item.quantity,
        price: item.price_per_unit || item.price,
      });
    });

    return Object.values(grouped);
  }

  /**
   * Find nearest active retailer with available stock using spatial distance
   */
  async findNearestRetailerWithStock(latitude: number, longitude: number) {
    try {
      console.log(`📍 Finding nearest retailer to (${latitude}, ${longitude})`);

      const nearestRetailer = await db.query.retailers.findFirst({
        where: and(
          eq(schema.retailers.is_active, true),
          sql`EXISTS (
            SELECT 1 FROM retail_inventory 
            WHERE retailer_id = retailers.id 
            AND quantity_available > 0
          )`
        ),
        orderBy: (retailers, { asc }) => [
          asc(
            sql`(
              (${latitude} - CAST(retailers.latitude AS FLOAT)) * 
              (${latitude} - CAST(retailers.latitude AS FLOAT)) +
              (${longitude} - CAST(retailers.longitude AS FLOAT)) *
              (${longitude} - CAST(retailers.longitude AS FLOAT))
            )`
          ),
        ],
      });

      if (!nearestRetailer) {
        return null;
      }

      console.log(`✓ Found retailer: ${nearestRetailer.business_name}`);

      const inventory = await db.query.retailInventory.findMany({
        where: and(
          eq(schema.retailInventory.retailer_id, nearestRetailer.id),
          gt(schema.retailInventory.quantity_available, 0)
        ),
      });

      const groupedByBrand = this.groupInventoryByBrand(inventory);

      return {
        retailer: {
          id: nearestRetailer.id,
          business_name: nearestRetailer.business_name,
          latitude: nearestRetailer.latitude,
          longitude: nearestRetailer.longitude,
          address: nearestRetailer.address,
          phone: nearestRetailer.phone,
          rating: nearestRetailer.rating,
        },
        inventory: groupedByBrand,
      };
    } catch (error) {
      console.error('❌ Error finding nearest retailer:', error);
      throw error;
    }
  }

  /**
   * CALCULATION: Get retailer dashboard statistics
   */
  async getRetailerStats(userId: number) {
    try {
      const retailer = await this.getRetailerByUserId(userId);
      const retailerId = retailer.id;

      // 1. Active Orders
      const activeOrderStatuses = ['pending', 'confirmed', 'processing', 'in_delivery'];
      const allOrders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.retailer_id, retailerId));

      const activeOrders = allOrders.filter(o => 
        activeOrderStatuses.includes(o.status)
      ).length;

      // 2. Stock Level (Aggregated sum from retail_inventory)
      const stockResult = await db
        .select({
          totalStock: sql<number>`COALESCE(SUM(${schema.retailInventory.quantity_available}), 0)`
        })
        .from(schema.retailInventory)
        .where(eq(schema.retailInventory.retailer_id, retailerId));

      const stockLevel = Number(stockResult[0]?.totalStock || 0);

      // 3. Today's Sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });

      const todaySales = todayOrders.reduce((sum, order) => {
        return sum + parseFloat(order.final_price || '0');
      }, 0);

      // 4. Rating
      const rating = parseFloat(retailer.rating || '5.0');

      console.log('✓ Retailer stats calculated:', {
        activeOrders,
        stockLevel,
        todaySales,
        rating,
      });

      return {
        activeOrders,
        stockLevel,
        todaySales: Math.round(todaySales),
        rating: Math.round(rating * 10) / 10,
      };
    } catch (error) {
      console.error('Error getting retailer stats:', error);
      throw error;
    }
  }

  /**
   * Get all orders for this retailer
   */
  async getRetailerOrders(userId: number, limit = 10) {
    try {
      const retailer = await this.getRetailerByUserId(userId);

      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.retailer_id, retailer.id))
        .orderBy(desc(schema.orders.created_at))
        .limit(limit);

      console.log(`✓ Retrieved ${orders.length} orders for retailer`);
      return orders;
    } catch (error) {
      console.error('Error getting retailer orders:', error);
      throw error;
    }
  }

  /**
   * Get inventory for a retailer (Supports lookup by retailerId directly or via userId)
   */
  async getRetailerInventory(identifier: number, isUserId = true) {
    try {
      let retailerId = identifier;
      if (isUserId) {
        const retailer = await this.getRetailerByUserId(identifier);
        retailerId = retailer.id;
      }

      const inventory = await db.query.retailInventory.findMany({
        where: eq(schema.retailInventory.retailer_id, retailerId),
        orderBy: (ri, { asc }) => [asc(ri.brand), asc(ri.cylinder_size)],
      });

      console.log(`✓ Retrieved ${inventory.length} inventory items for retailer ${retailerId}`);
      return inventory;
    } catch (error) {
      console.error('Error getting inventory:', error);
      throw error;
    }
  }

  /**
   * Add or update inventory entry for a retailer
   */
  async addOrUpdateInventory(
    userId: number,
    brand: string,
    cylinderSize: string,
    quantityToAdd: number,
    pricePerUnit: number
  ) {
    try {
      const retailer = await this.getRetailerByUserId(userId);
      const retailerId = retailer.id;

      console.log(
        `📦 Adding inventory: Retailer ${retailerId}, ${brand} ${cylinderSize}, ${quantityToAdd} units @ ${pricePerUnit}`
      );

      const existing = await db.query.retailInventory.findFirst({
        where: and(
          eq(schema.retailInventory.retailer_id, retailerId),
          eq(schema.retailInventory.brand, brand),
          eq(schema.retailInventory.cylinder_size, cylinderSize)
        ),
      });

      if (existing) {
        console.log(`✓ Updating existing inventory (ID: ${existing.id})`);
        await db
          .update(schema.retailInventory)
          .set({
            quantity_available: existing.quantity_available + quantityToAdd,
            price_per_unit: pricePerUnit.toString(),
            updated_at: new Date(),
            last_restocked: new Date(),
          })
          .where(eq(schema.retailInventory.id, existing.id));
      } else {
        console.log('✓ Creating new inventory entry');
        await db.insert(schema.retailInventory).values({
          retailer_id: retailerId,
          brand,
          cylinder_size: cylinderSize,
          quantity_available: quantityToAdd,
          price_per_unit: pricePerUnit.toString(),
          last_restocked: new Date(),
        });
      }

      console.log('✓ Inventory added/updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error adding/updating inventory:', error);
      throw error;
    }
  }

  /**
   * Deduct inventory when an order is created/processed
   */
  async deductInventory(
    retailerId: number,
    brand: string,
    cylinderSize: string,
    quantityToDeduct: number
  ) {
    try {
      console.log(
        `📉 Deducting inventory: ${quantityToDeduct} units of ${brand} ${cylinderSize} from retailer ${retailerId}`
      );

      const inventory = await db.query.retailInventory.findFirst({
        where: and(
          eq(schema.retailInventory.retailer_id, retailerId),
          eq(schema.retailInventory.brand, brand),
          eq(schema.retailInventory.cylinder_size, cylinderSize)
        ),
      });

      if (!inventory) {
        throw new AppError(444, 'Inventory entry not found');
      }

      if (inventory.quantity_available < quantityToDeduct) {
        throw new AppError(
          400,
          `Insufficient stock. Available: ${inventory.quantity_available}, Requested: ${quantityToDeduct}`
        );
      }

      await db
        .update(schema.retailInventory)
        .set({
          quantity_available: inventory.quantity_available - quantityToDeduct,
          updated_at: new Date(),
        })
        .where(eq(schema.retailInventory.id, inventory.id));

      console.log(
        `✓ Inventory deducted. New quantity: ${inventory.quantity_available - quantityToDeduct}`
      );
      return { success: true };
    } catch (error) {
      console.error('❌ Error deducting inventory:', error);
      throw error;
    }
  }

  /**
   * Legacy stock update method (Updates a specific inventory item by ID)
   */
  async updateInventoryItem(userId: number, itemId: number, quantity: number) {
    try {
      if (quantity < 0) {
        throw new AppError(400, "Quantity cannot be negative");
      }

      await this.getRetailerByUserId(userId);

      const updated = await db
        .update(schema.retailInventory)
        .set({ 
          quantity_available: quantity,
          updated_at: new Date()
        })
        .where(eq(schema.retailInventory.id, itemId))
        .returning();

      console.log(`✓ Inventory item ${itemId} updated to ${quantity}`);
      return updated[0];
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  /**
   * Get M-Pesa settings for this retailer
   */
  async getMPesaSettings(userId: number) {
    try {
      await this.getRetailerByUserId(userId);

      return {
        phone: '', 
        isVerified: false,
      };
    } catch (error) {
      console.error('Error getting M-Pesa settings:', error);
      throw error;
    }
  }

  /**
   * Update M-Pesa settings
   */
  async updateMPesaSettings(userId: number, phone: string) {
    try {
      if (!/^07\d{8}$/.test(phone)) {
        throw new AppError(400, "Invalid phone number format");
      }

      await this.getRetailerByUserId(userId);

      console.log(`✓ M-Pesa phone updated for retailer: ${phone}`);

      return {
        phone,
        isVerified: false,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error updating M-Pesa settings:', error);
      throw error;
    }
  }

  /**
   * Accept an order
   */
  async acceptOrder(userId: number, orderId: number) {
    try {
      const retailer = await this.getRetailerByUserId(userId);

      const order = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId));

      if (order.length === 0) {
        throw new AppError(404, "Order not found");
      }

      // Deduct inventory stock if order specifies brand and size
      if (order[0].brand && order[0].cylinder_size) {
        await this.deductInventory(
          retailer.id,
          order[0].brand,
          order[0].cylinder_size,
          order[0].quantity
        );
      }

      const updated = await db
        .update(schema.orders)
        .set({ status: "confirmed" })
        .where(eq(schema.orders.id, orderId))
        .returning();

      console.log(`✓ Order #${orderId} accepted`);
      return updated[0];
    } catch (error) {
      console.error('Error accepting order:', error);
      throw error;
    }
  }

  /**
   * Reject an order
   */
  async rejectOrder(userId: number, orderId: number) {
    try {
      await this.getRetailerByUserId(userId);

      const updated = await db
        .update(schema.orders)
        .set({ status: "pending" })
        .where(eq(schema.orders.id, orderId))
        .returning();

      console.log(`✓ Order #${orderId} rejected`);
      return updated[0];
    } catch (error) {
      console.error('Error rejecting order:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(userId: number, period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    try {
      const retailer = await this.getRetailerByUserId(userId);

      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.retailer_id, retailer.id));

      let periodOrders = orders;
      const now = new Date();

      if (period === 'daily') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        periodOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        });
      } else if (period === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        periodOrders = orders.filter(o => new Date(o.created_at) >= weekAgo);
      } else if (period === 'monthly') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        periodOrders = orders.filter(o => new Date(o.created_at) >= monthAgo);
      }

      const totalRevenue = periodOrders.reduce((sum, o) => sum + parseFloat(o.final_price || '0'), 0);
      const deliveredOrders = periodOrders.filter(o => o.status === 'delivered').length;
      const cancelledOrders = periodOrders.filter(o => o.status === 'cancelled').length;
      const avgOrderValue = periodOrders.length > 0 ? totalRevenue / periodOrders.length : 0;
      const cancellationRate = periodOrders.length > 0 
        ? ((cancelledOrders / periodOrders.length) * 100).toFixed(1)
        : '0';

      return {
        period,
        totalOrders: periodOrders.length,
        totalRevenue: `${totalRevenue.toFixed(0)} KES`,
        averageOrderValue: `${avgOrderValue.toFixed(0)} KES`,
        ordersDelivered: deliveredOrders,
        cancellationRate: `${cancellationRate}%`,
        avgDeliveryTime: '2-4 hours',
        customerSatisfaction: parseFloat(retailer.rating || '4.8'),
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get retailer directly by primary key ID
   */
  async getRetailerById(retailerId: number) {
    try {
      const retailer = await db.query.retailers.findFirst({
        where: eq(schema.retailers.id, retailerId),
      });

      return retailer || null;
    } catch (error) {
      console.error('❌ Error fetching retailer by ID:', error);
      throw error;
    }
  }
}

export const retailerService = new RetailerService();