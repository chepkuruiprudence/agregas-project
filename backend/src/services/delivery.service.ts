import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class DeliveryService {
  async geoMatch(
    customerLat: number,
    customerLng: number,
    brand: string,
    quantity: number
  ) {
    try {
      // Get all retailers with stock
      const retailers = await db
        .select()
        .from(schema.retailers)
        .where(eq(schema.retailers.brand, brand));

      if (retailers.length === 0) {
        throw new AppError(404, "No retailers available");
      }

      // Calculate distance to each retailer
      const withDistance = retailers.map((retailer) => {
        const lat = parseFloat(retailer.latitude);
        const lng = parseFloat(retailer.longitude);

        const distance = Math.sqrt(
          Math.pow(lat - customerLat, 2) + Math.pow(lng - customerLng, 2)
        );

        return { ...retailer, distance };
      });

      // Sort by distance
      withDistance.sort((a, b) => a.distance - b.distance);

      // Return nearest
      return withDistance[0];
    } catch (error) {
      throw error;
    }
  }

  async createDeliveryTracking(orderId: number, retailerId: number) {
    try {
      // Get retailer location
      const retailer = await db
        .select()
        .from(schema.retailers)
        .where(eq(schema.retailers.id, retailerId));

      if (retailer.length === 0) {
        throw new AppError(404, "Retailer not found");
      }

      const newTracking = await db
        .insert(schema.deliveryTracking)
        .values({
          order_id: orderId,
          status: "pending",
          latitude: retailer[0].latitude,
          longitude: retailer[0].longitude,
          current_address: retailer[0].address,
        })
        .returning();

      return newTracking[0];
    } catch (error) {
      throw error;
    }
  }

  async updateDeliveryPosition(
    trackingId: number,
    latitude: number,
    longitude: number,
    status: string
  ) {
    try {
      const updated = await db
        .update(schema.deliveryTracking)
        .set({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          status: status as any,
        })
        .where(eq(schema.deliveryTracking.id, trackingId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "Tracking record not found");
      }

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  async getDeliveryStatus(orderId: number) {
    try {
      const tracking = await db
        .select()
        .from(schema.deliveryTracking)
        .where(eq(schema.deliveryTracking.order_id, orderId));

      if (tracking.length === 0) {
        throw new AppError(404, "Delivery not found");
      }

      return {
        orderId,
        status: tracking[0].status,
        latitude: tracking[0].latitude,
        longitude: tracking[0].longitude,
        currentAddress: tracking[0].current_address,
        estimatedArrival: tracking[0].estimated_arrival_time,
        actualDelivery: tracking[0].actual_delivery_time,
      };
    } catch (error) {
      throw error;
    }
  }

  async completeDelivery(trackingId: number) {
    try {
      const updated = await db
        .update(schema.deliveryTracking)
        .set({
          status: "delivered",
          actual_delivery_time: new Date(),
        })
        .where(eq(schema.deliveryTracking.id, trackingId))
        .returning();

      return updated[0];
    } catch (error) {
      throw error;
    }
  }
}

export const deliveryService = new DeliveryService();