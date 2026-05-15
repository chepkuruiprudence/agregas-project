import { Request, Response, NextFunction } from "express";
import { cgcService } from "../services/cgc.service";
import { AppError } from "../middleware/errorHandler";

export async function earnCGC(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { customerId, orderId, quantityKg } = req.body;

    if (customerId === undefined || orderId === undefined || quantityKg === undefined) {
      throw new AppError(400, "All fields are required");
    }

    const record = await cgcService.earnCGC(customerId, orderId, quantityKg);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "CGC earned",
      data: record,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function redeemCGC(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { cgcAmount, orderId } = req.body;

    if (cgcAmount === undefined || orderId === undefined) {
      throw new AppError(400, "All fields are required");
    }

    const result = await cgcService.redeemCGC(
      req.user.userId,
      cgcAmount,
      orderId
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "CGC redeemed",
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

    const balance = await cgcService.getBalance(req.user.userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "CGC balance retrieved",
      data: balance,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getCarbonRevenue(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const revenue = await cgcService.calculateCarbonRevenue();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Carbon revenue calculated",
      data: revenue,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}