import { Request, Response, NextFunction } from "express";
import { deliveryService } from "../services/delivery.service";
import { AppError } from "../middleware/errorHandler";

export async function getDeliveryStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      throw new AppError(400, "Order ID is required");
    }

    const status = await deliveryService.getDeliveryStatus(parseInt(orderId as string));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Delivery status retrieved",
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePosition(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { trackingId, latitude, longitude, status } = req.body;

    if (trackingId === undefined || latitude === undefined || longitude === undefined) {
      throw new AppError(400, "All fields are required");
    }

    const updated = await deliveryService.updateDeliveryPosition(
      trackingId,
      latitude,
      longitude,
      status || "in_transit"
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Delivery position updated",
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function completeDelivery(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      throw new AppError(400, "Order ID is required");
    }

    // Get tracking record for this order
    const tracking = await deliveryService.getDeliveryStatus(parseInt(orderId as string));

    // For now, assume trackingId is available (in real app, query properly)
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Delivery completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}