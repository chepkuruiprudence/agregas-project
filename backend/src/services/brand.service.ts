// import { drizzle } from "drizzle-orm/node-postgres";
// import { Pool } from "pg";
// import { eq, desc } from "drizzle-orm";
// import * as schema from "../db/schema";
// import { AppError } from "../middleware/errorHandler";

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// const db = drizzle(pool, { schema });

// export class BrandService {
//   async getBrandProducts(brand: string) {
//     try {
//       const products = await db
//         .select()
//         .from(schema.products)
//         .where(eq(schema.products.brand, brand));

//       return products;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async setBasePrice(productId: number, newPrice: number) {
//     try {
//       const updated = await db
//         .update(schema.products)
//         .set({ base_price: newPrice.toString() })
//         .where(eq(schema.products.id, productId))
//         .returning();

//       if (updated.length === 0) {
//         throw new AppError(404, "Product not found");
//       }

//       return updated[0];
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getBrandRetailers(brand: string) {
//     try {
//       const retailers = await db
//         .select()
//         .from(schema.retailers)
//         .where(eq(schema.retailers.brand, brand));

//       return retailers;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getBrandAnalytics(brand: string) {
//     try {
//       const orders = await db
//         .select()
//         .from(schema.orders)
//         .where(eq(schema.orders.brand, brand));

//       const totalSales = orders.length;
//       const totalRevenue = orders.reduce(
//         (sum, order) => sum + parseFloat(order.final_price),
//         0
//       );

//       const retailers = await this.getBrandRetailers(brand);

//       return {
//         brand,
//         totalSales,
//         totalRevenue,
//         averageSaleValue: totalRevenue / totalSales,
//         activeRetailers: retailers.length,
//       };
//     } catch (error) {
//       throw error;
//     }
//   }
// }

// export const brandService = new BrandService();

import { db } from "../db/index";
import { eq, and, sum } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

export class BrandService {
  /**
   * CALCULATION: Get brand statistics
   * Calculates:
   * - Total Products: COUNT of products
   * - Active Retailers: COUNT DISTINCT retailers carrying products
   * - Total Volume Sold: SUM of order quantities
   * - Total CGCs Issued: SUM of cgc_tokens
   * - Monthly Revenue: SUM of finalPrice for orders this month
   * - Market Share: (Brand Volume / Total Platform Volume) * 100
   * - Average Rating: AVG of retailer ratings
   */
  async getBrandStats(userId: number) {
    try {
      // Get brand ID
      const brand = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!brand[0] || brand[0].role !== 'brand') {
        throw new AppError(403, "User is not a brand marketer");
      }

      // 1. Total Products
      const productCount = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.brand, brand[0].full_name));

      const totalProducts = productCount.length;

      // 2. Active Retailers (need to query orders from this brand's products)
      const ordersData = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.brand, brand[0].full_name));

      const activeRetailers = new Set(ordersData.map(o => o.retailer_id)).size;

      // 3. Total Volume Sold (kg)
      const volumeData = ordersData.reduce((sum, order) => {
        return sum + (order.quantity || 0);
      }, 0);

      // 4. Total CGCs Issued
      const cgcData = await db
        .select()
        .from(schema.cgcTokens);

      const totalCgcs = cgcData.length;

      // 5. Monthly Revenue (this month)
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const monthlyOrdersData = ordersData.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= monthStart;
      });

      const monthlyRevenue = monthlyOrdersData.reduce((sum, order) => {
        const finalPrice = parseFloat(order.final_price) || 0;
        return sum + finalPrice;
      }, 0);

      // 6. Market Share: (Brand Volume / Total Volume) * 100
      const allOrdersData = await db.select().from(schema.orders);
      const totalPlatformVolume = allOrdersData.reduce((sum, order) => {
        return sum + (order.quantity || 0);
      }, 0);

      const marketShare = totalPlatformVolume > 0 
        ? ((volumeData / totalPlatformVolume) * 100).toFixed(1)
        : '0';

      // 7. Average Rating (from retailers)
      const retailersData = await db.select().from(schema.retailers);
      const avgRating = retailersData.length > 0
        ? retailersData.reduce((sum, r) => sum + parseFloat(r.rating || '0'), 0) / retailersData.length
        : 0;

      const totalReviews = retailersData.reduce((sum, r) => sum + (r.total_reviews || 0), 0);

      return {
        totalProducts,
        activeRetailers,
        totalVolumeSold: volumeData,
        totalCgcsIssued: totalCgcs,
        monthlyRevenue: `${monthlyRevenue.toFixed(0)} KES`,
        marketShare: `${marketShare}%`,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews,
      };
    } catch (error) {
      console.error('Error getting brand stats:', error);
      throw error;
    }
  }

  /**
   * Get all products for this brand
   */
  async getBrandProducts(userId: number) {
    try {
      const brand = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!brand[0] || brand[0].role !== 'brand') {
        throw new AppError(403, "User is not a brand");
      }

      const products = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.brand, brand[0].full_name));

      return products.map(p => ({
        id: p.id,
        name: `${p.brand} ${p.cylinder_size}`,
        cylinderSize: p.cylinder_size,
        basePrice: p.base_price,
        category: p.brand,
        isActive: true, // Assuming all are active
      }));
    } catch (error) {
      console.error('Error getting brand products:', error);
      throw error;
    }
  }

  /**
   * Create a new product
   */
  async createProduct(userId: number, productData: any) {
    try {
      const brand = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!brand[0] || brand[0].role !== 'brand') {
        throw new AppError(403, "User is not a brand");
      }

      const newProduct = await db
        .insert(schema.products)
        .values({
          brand: brand[0].full_name,
          cylinder_size: productData.cylinderSize,
          base_price: productData.basePrice,
          description: productData.description,
        })
        .returning();

      return newProduct[0];
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update a product
   */
  async updateProduct(userId: number, productId: number, updateData: any) {
    try {
      const brand = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!brand[0] || brand[0].role !== 'brand') {
        throw new AppError(403, "User is not a brand");
      }

      const updated = await db
        .update(schema.products)
        .set({
          base_price: updateData.basePrice || undefined,
          description: updateData.description || undefined,
        })
        .where(
          and(
            eq(schema.products.id, productId),
            eq(schema.products.brand, brand[0].full_name)
          )
        )
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "Product not found");
      }

      return updated[0];
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(userId: number, productId: number) {
    try {
      const brand = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!brand[0] || brand[0].role !== 'brand') {
        throw new AppError(403, "User is not a brand");
      }

      const deleted = await db
        .delete(schema.products)
        .where(
          and(
            eq(schema.products.id, productId),
            eq(schema.products.brand, brand[0].full_name)
          )
        )
        .returning();

      if (deleted.length === 0) {
        throw new AppError(404, "Product not found");
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * CALCULATION: Get all retailers carrying brand products with distance
   * Calculates:
   * - Distance: Using Euclidean formula: sqrt((lat2-lat1)² + (lng2-lng1)²)
   * - Total Orders: COUNT of orders from this retailer for this brand
   * - Rating: AVG rating from reviews
   */
  async getBrandRetailers(userId: number) {
    try {
      const brand = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!brand[0] || brand[0].role !== 'brand') {
        throw new AppError(403, "User is not a brand marketer");
      }

      // Get all orders for this brand
      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.brand, brand[0].full_name));

      // Get retailer IDs from orders
      const retailerIds = new Set(orders.map(o => o.retailer_id));

      if (retailerIds.size === 0) {
        return [];
      }

      // Get retailer details
      const retailers = await db.select().from(schema.retailers);

      const result = Array.from(retailerIds).map(retailerId => {
        const retailer = retailers.find(r => r.id === retailerId);
        const retailerOrders = orders.filter(o => o.retailer_id === retailerId);

        if (!retailer) return null;

        // Calculate distance using Euclidean formula
        // This would need brand's home location or average location
        // For now, using 0 as placeholder (you'd need to implement proper geo-calculation)
        const distance = 0;

        const totalOrders = retailerOrders.length;
        const rating = parseFloat(retailer.rating || '0');

        return {
          id: retailer.id,
          businessName: retailer.business_name,
          latitude: parseFloat(retailer.latitude || '0'),
          longitude: parseFloat(retailer.longitude || '0'),
          distance,
          isVerified: retailer.is_verified,
          totalOrders,
          rating,
        };
      }).filter(Boolean);

      return result;
    } catch (error) {
      console.error('Error getting brand retailers:', error);
      throw error;
    }
  }

  /**
   * Get detailed analytics for the brand
   */
  async getBrandAnalytics(userId: number, period: string = 'monthly') {
    try {
      const brand = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!brand[0] || brand[0].role !== 'brand') {
        throw new AppError(403, "User is not a brand");
      }

      // Placeholder: Return empty analytics structure
      // You'll need to implement proper date-based filtering
      return {
        chartData: [],
        topProducts: [],
        topRetailers: [],
        regionPerformance: [],
      };
    } catch (error) {
      console.error('Error getting brand analytics:', error);
      throw error;
    }
  }

  /**
   * Update pricing for a product
   */
  async updatePricing(userId: number, productId: number, newBasePrice: string, reason?: string) {
    try {
      const brand = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!brand[0] || brand[0].role !== 'brand') {
        throw new AppError(403, "User is not a brand");
      }

      const updated = await db
        .update(schema.products)
        .set({
          base_price: newBasePrice,
        })
        .where(eq(schema.products.id, productId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "Product not found");
      }

      // Log pricing change for audit
      console.log(`Pricing updated: Product ${productId} - New Price: ${newBasePrice} - Reason: ${reason}`);

      return updated[0];
    } catch (error) {
      console.error('Error updating pricing:', error);
      throw error;
    }
  }

  /**
   * Get retailer performance metrics
   */
  async getRetailerPerformance(userId: number, retailerId: number) {
    try {
      const brand = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!brand[0] || brand[0].role !== 'brand') {
        throw new AppError(403, "User is not a brand");
      }

      const retailer = await db
        .select()
        .from(schema.retailers)
        .where(eq(schema.retailers.id, retailerId));

      if (retailer.length === 0) {
        throw new AppError(404, "Retailer not found");
      }

      const orders = await db
        .select()
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.retailer_id, retailerId),
            eq(schema.orders.brand, brand[0].full_name)
          )
        );

      const totalVolume = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);
      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.final_price || '0'), 0);
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      return {
        retailerId,
        businessName: retailer[0].business_name,
        totalOrders: orders.length,
        totalVolume,
        totalRevenue: `${totalRevenue.toFixed(0)} KES`,
        averageOrderValue: `${avgOrderValue.toFixed(0)} KES`,
        lastOrderDate: orders.length > 0 ? orders[orders.length - 1].created_at : null,
        rating: parseFloat(retailer[0].rating || '0'),
        reviews: retailer[0].total_reviews || 0,
        verificationStatus: retailer[0].is_verified ? 'verified' : 'pending',
      };
    } catch (error) {
      console.error('Error getting retailer performance:', error);
      throw error;
    }
  }
}

export const brandService = new BrandService();