// backend/src/controllers/order.controller.ts
import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import { AppError } from "../middleware/errorHandler";

export const ordersController = {
  /**
   * POST /api/orders
   * Create a new order with product & spatial retailer matching
   * REQUIRES AUTH
   */
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      // Support both req.user.userId and req.user.id
      const customerId = req.user?.userId || req.user?.userId;
      if (!customerId) {
        throw new AppError(401, "Authentication required");
      }

      // Destructure and fall back between snake_case and camelCase
      const {
        purchaseType,
        purchase_type,
        brand,
        cylinderSize,
        cylinder_size,
        quantity,
        latitude,
        delivery_latitude,
        longitude,
        delivery_longitude,
        deliveryAddress,
        delivery_address,
        paymentMethod,
        payment_method,
        retailer_id,
        explicitRetailerId,
      } = req.body;

      // Resolved properties prioritizing snake_case then camelCase
      const resolvedPurchaseType = (purchaseType || purchase_type || "refill") as "refill" | "outright";
      const resolvedBrand = brand;
      const resolvedCylinderSize = cylinderSize || cylinder_size;
      const resolvedQuantity = parseInt(quantity as any);
      const resolvedLat = (latitude || delivery_latitude)?.toString();
      const resolvedLng = (longitude || delivery_longitude)?.toString();
      const resolvedAddress = deliveryAddress || delivery_address || "";
      const resolvedPaymentMethod = paymentMethod || payment_method;
      const resolvedRetailerId = retailer_id ? parseInt(retailer_id as any) : (explicitRetailerId ? parseInt(explicitRetailerId as any) : undefined);

      console.log("📥 Received Order Payload:", {
        customerId,
        purchaseType: resolvedPurchaseType,
        brand: resolvedBrand,
        cylinderSize: resolvedCylinderSize,
        quantity: resolvedQuantity,
        latitude: resolvedLat,
        longitude: resolvedLng,
        deliveryAddress: resolvedAddress,
        paymentMethod: resolvedPaymentMethod,
        retailerId: resolvedRetailerId,
      });

      // Field Validation
      const missingFields: string[] = [];
      if (!resolvedBrand) missingFields.push("brand");
      if (!resolvedCylinderSize) missingFields.push("cylinderSize / cylinder_size");
      if (!resolvedQuantity || isNaN(resolvedQuantity)) missingFields.push("quantity");
      if (!resolvedPaymentMethod) missingFields.push("paymentMethod / payment_method");

      if (missingFields.length > 0) {
        throw new AppError(
          400,
          `Missing or invalid required fields: ${missingFields.join(", ")}`
        );
      }

      if (resolvedQuantity <= 0) {
        throw new AppError(400, "Quantity must be greater than 0");
      }

      if (!["refill", "outright"].includes(resolvedPurchaseType)) {
        throw new AppError(400, "Invalid purchase type. Must be 'refill' or 'outright'");
      }

      // Validate coordinates if provided
      if (resolvedLat && resolvedLng) {
        const parsedLat = parseFloat(resolvedLat);
        const parsedLng = parseFloat(resolvedLng);
        if (isNaN(parsedLat) || isNaN(parsedLng)) {
          throw new AppError(400, "Latitude and longitude must be valid numbers");
        }
      }

      console.log(`🛒 Creating order for customer #${customerId}`);

      // Call Service Engine
      const order = await orderService.createOrder(
        customerId,
        resolvedPurchaseType,
        resolvedBrand,
        resolvedCylinderSize,
        resolvedQuantity,
        resolvedLat || "0.000000",
        resolvedLng || "0.000000",
        resolvedAddress,
        resolvedPaymentMethod.trim(),
        resolvedRetailerId
      );

      console.log(`✅ Order created successfully: #${order.id}`);

      return res.status(201).json({
        success: true,
        statusCode: 201,
        message: "Order created successfully",
        data: order,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("❌ Order creation error:", error.message || error);
      next(error);
    }
  },

  /**
   * GET /api/orders/:orderId or /api/orders/:id
   * Get order details by ID
   */
  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.orderId || req.params.id;

      if (!orderId || isNaN(parseInt(orderId as string))) {
        throw new AppError(400, "Valid Order ID is required");
      }

      const order = await orderService.getOrderById(parseInt(orderId as string));

      if (!order) {
        throw new AppError(404, "Order not found");
      }

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Order retrieved successfully",
        data: order,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/orders/customer or /api/orders/my-orders
   * Get all orders for authenticated customer
   * REQUIRES AUTH
   */
  async getCustomerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.userId || req.user?.userId;
      if (!customerId) {
        throw new AppError(401, "Authentication required");
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const orders = await orderService.getCustomerOrders(customerId, limit, offset);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Customer orders retrieved",
        data: orders,
        pagination: { limit, offset, total: orders.length },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/retailers/:retailerId/orders
   * Get orders assigned to a specific retailer
   * REQUIRES AUTH
   */
  async getRetailerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { retailerId } = req.params;

      if (!retailerId || isNaN(parseInt(retailerId as string))) {
        throw new AppError(400, "Valid retailerId is required");
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const retailerOrders = await orderService.getRetailerOrders(
        parseInt(retailerId as string),
        limit,
        offset
      );

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Retailer orders retrieved",
        data: retailerOrders,
        pagination: { limit, offset, total: retailerOrders.length },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/orders/:orderId/status or PUT /api/orders/:id/status
   * Update order status
   */
  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.orderId || req.params.id;
      const { status } = req.body;

      if (!orderId || isNaN(parseInt(orderId as string))) {
        throw new AppError(400, "Valid Order ID is required");
      }

      if (!status) {
        throw new AppError(400, "Status is required");
      }

      const updatedOrder = await orderService.updateOrderStatus(
        parseInt(orderId as string),
        status
      );

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Order status updated to ${status}`,
        data: updatedOrder,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/orders/:id/cancel
   * Cancel an order
   */
  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.orderId || req.params.id;

      if (!orderId || isNaN(parseInt(orderId as string))) {
        throw new AppError(400, "Valid Order ID is required");
      }

      const cancelledOrder = await orderService.cancelOrder(parseInt(orderId as string));

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Order cancelled successfully",
        data: cancelledOrder,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};

// Standard functions exports for route compatibility
export const createOrder = ordersController.createOrder;
export const getOrderById = ordersController.getOrderById;
export const getCustomerOrders = ordersController.getCustomerOrders;
export const getRetailerOrders = ordersController.getRetailerOrders;
export const updateOrderStatus = ordersController.updateOrderStatus;
export const cancelOrder = ordersController.cancelOrder;