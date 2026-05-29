import { Request, Response, NextFunction } from "express";
import { retailerService } from "../services/retailer.service";
import { AppError } from "../middleware/errorHandler";

export async function getInventory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { retailerId } = req.params;

    if (!retailerId) {
      throw new AppError(400, "Retailer ID is required");
    }

    const inventory = await retailerService.getRetailerInventory(
      parseInt(retailerId as string)
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Inventory retrieved",
      data: inventory,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateInventory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { retailerId } = req.params;
    const { newQuantity } = req.body;

    if (!retailerId || newQuantity === undefined) {
      throw new AppError(400, "Retailer ID and new quantity are required");
    }

    const updated = await retailerService.updateInventory(
      parseInt(retailerId as string),
      newQuantity
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Inventory updated",
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getPendingOrders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { retailerId } = req.params;

    if (!retailerId) {
      throw new AppError(400, "Retailer ID is required");
    }

    const orders = await retailerService.getPendingOrders(parseInt(retailerId as string));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Pending orders retrieved",
      data: orders,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function acceptOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { retailerId, orderId } = req.params;

    if (!retailerId || !orderId) {
      throw new AppError(400, "Retailer ID and Order ID are required");
    }

    const result = await retailerService.acceptOrder(
      parseInt(retailerId as string),
      parseInt(orderId as string)
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Order accepted",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { retailerId, orderId } = req.params;

    if (!retailerId || !orderId) {
      throw new AppError(400, "Retailer ID and Order ID are required");
    }

    const result = await retailerService.rejectOrder(
      parseInt(retailerId as string),
      parseInt(orderId as string)
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Order rejected",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { retailerId } = req.params;

    if (!retailerId) {
      throw new AppError(400, "Retailer ID is required");
    }

    const analytics = await retailerService.getAnalytics(parseInt(retailerId as string));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Analytics retrieved",
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}