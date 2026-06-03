import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import { AppError } from "../middleware/errorHandler";

/**
 * Create a new order with full validation
 * Expects: purchaseType, brand, cylinderSize, quantity, latitude, longitude, deliveryAddress, paymentMethod
 */
export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    // ✅ Destructure ALL fields from formData
    const {
      purchaseType,
      brand,
      cylinderSize,
      quantity,
      latitude,
      longitude,
      deliveryAddress,
      paymentMethod,
    } = req.body;

    // 🔴 DEBUG: Log received data
    console.log("📥 Received request body:", {
      purchaseType,
      brand,
      cylinderSize,
      quantity,
      latitude,
      longitude,
      deliveryAddress,
      paymentMethod,
    });

    // ✅ Validate all required fields
    if (
      !purchaseType ||
      !brand ||
      !cylinderSize ||
      !quantity ||
      !latitude ||
      !longitude ||
      !deliveryAddress ||
      !paymentMethod
    ) {
      const missing = [];
      if (!purchaseType) missing.push("purchaseType");
      if (!brand) missing.push("brand");
      if (!cylinderSize) missing.push("cylinderSize");
      if (!quantity) missing.push("quantity");
      if (!latitude) missing.push("latitude");
      if (!longitude) missing.push("longitude");
      if (!deliveryAddress) missing.push("deliveryAddress");
      if (!paymentMethod) missing.push("paymentMethod");

      throw new AppError(
        400,
        `Missing required fields: ${missing.join(", ")}`
      );
    }

    // ✅ Validate purchase type
    if (!["refill", "outright"].includes(purchaseType)) {
      throw new AppError(400, "Invalid purchase type. Must be 'refill' or 'outright'");
    }

    // ✅ Validate quantity is a number
    const qty = parseInt(quantity as any);
    if (isNaN(qty) || qty < 1) {
      throw new AppError(400, "Quantity must be a positive number");
    }

    // ✅ Validate coordinates are numbers
    const lat = parseFloat(latitude as any);
    const lng = parseFloat(longitude as any);
    if (isNaN(lat) || isNaN(lng)) {
      throw new AppError(400, "Latitude and longitude must be valid numbers");
    }

    // ✅ Pass all fields to service
    console.log(`🛒 Creating order for customer ${req.user.userId}`);
    const order = await orderService.createOrder(
      req.user.userId,
      purchaseType as "refill" | "outright",
      brand,
      cylinderSize,
      qty,
      latitude,
      longitude,
      deliveryAddress,
      paymentMethod
    );

    console.log(`✅ Order created successfully: #${order.id}`);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Order created successfully",
      data: order,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Create order error:", error);
    next(error);
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    // Validate ID is a valid number
    if (!id || isNaN(parseInt(id as string))) {
      throw new AppError(400, "Invalid Order ID");
    }

    const order = await orderService.getOrderById(parseInt(id as string));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Order retrieved",
      data: order,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all orders for authenticated customer
 */
export async function getCustomerOrders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const orders = await orderService.getCustomerOrders(req.user.userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Customer orders retrieved",
      data: orders,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || isNaN(parseInt(id as string))) {
      throw new AppError(400, "Invalid Order ID");
    }

    if (!status) {
      throw new AppError(400, "Status is required");
    }

    const updated = await orderService.updateOrderStatus(
      parseInt(id as string),
      status
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Order status updated",
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id as string))) {
      throw new AppError(400, "Invalid Order ID");
    }

    const cancelled = await orderService.cancelOrder(parseInt(id as string));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Order cancelled",
      data: cancelled,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}