import { Request, Response, NextFunction } from "express";
import { loyaltyService } from "../services/loyalty.service";
import { AppError } from "../middleware/errorHandler";

export async function earnPoints(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { customerId, orderId, quantityKg } = req.body;

    if (customerId === undefined || orderId === undefined || quantityKg === undefined) {
      throw new AppError(400, "All fields are required");
    }

    const record = await loyaltyService.earnPoints(customerId, orderId, quantityKg);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Points earned",
      data: record,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function redeemPoints(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { pointsToRedeem, orderId } = req.body;

    if (pointsToRedeem === undefined || orderId === undefined) {
      throw new AppError(400, "All fields are required");
    }

    const result = await loyaltyService.redeemPoints(
      req.user.userId,
      pointsToRedeem,
      orderId
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Points redeemed",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getBalance(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const balance = await loyaltyService.getBalance(req.user.userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Balance retrieved",
      data: balance,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getHistory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const history = await loyaltyService.getHistory(req.user.userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "History retrieved",
      data: history,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}