import express, { Application } from "express";
import { errorHandler } from "../middleware/errorHandler";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import pricingRoutes from "./pricing.routes";
import orderRoutes from "./order.routes";
import subscriptionRoutes from "./subscription.routes";
import loyaltyRoutes from "./loyalty.routes";
import cgcRoutes from "./cgc.routes";
import gasCreditRoutes from "./gas-credit.routes";
import deliveryRoutes from "./delivery.routes";
import notificationRoutes from "./notification.routes";
import retailerRoutes from "./retailer.routes";
import brandRoutes from "./brand.routes";
import adminRoutes from "./admin.routes";
import paymentRoutes from "./payment.routes";
import inventoryRoutes from "./inventory.routes";

export function registerRoutes(app: Application) {
  // Auth routes (public)
  app.use("/api/auth", authRoutes);

  // User routes (authenticated)
  app.use("/api/users", userRoutes);

  // Business routes (authenticated)
  app.use("/api/pricing", pricingRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);
  app.use("/api/loyalty", loyaltyRoutes);
  app.use("/api/cgc", cgcRoutes);
  app.use("/api/gas-credit", gasCreditRoutes);
  app.use("/api/delivery", deliveryRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/retailer", retailerRoutes);
  app.use("/api/brand", brandRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use('/api/retailers', inventoryRoutes);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  
} 