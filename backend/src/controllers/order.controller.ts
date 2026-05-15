import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import { AppError } from "../middleware/errorHandler";

export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { brand, cylinderSize, quantity, deliveryAddress, paymentMethod } = req.body;

    if (!brand || !cylinderSize || !quantity || !deliveryAddress || !paymentMethod) {
      throw new AppError(400, "All fields are required");
    }

    const order = await orderService.createOrder(
      req.user.userId,
      brand,
      cylinderSize,
      quantity,
      deliveryAddress,
      paymentMethod
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Order created successfully",
      data: order,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, "Order ID is required");
    }

    const order = await orderService.getOrderById(parseInt(id));

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

export async function updateOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      throw new AppError(400, "Order ID and status are required");
    }

    const updated = await orderService.updateOrderStatus(parseInt(id), status);

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

export async function cancelOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, "Order ID is required");
    }

    const cancelled = await orderService.cancelOrder(parseInt(id));

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