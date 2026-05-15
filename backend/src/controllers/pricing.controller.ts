import { Request, Response, NextFunction } from "express";
import { pricingService } from "../services/pricing.service";
import { AppError } from "../middleware/errorHandler";

export async function getCurrentPrice(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { brand, cylinderSize } = req.query;

    if (!brand || !cylinderSize) {
      throw new AppError(400, "Brand and cylinderSize are required");
    }

    const price = await pricingService.getPricingSnapshot(
      brand as string,
      cylinderSize as string
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Current price retrieved",
      data: price,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function calculatePrice(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { brand, cylinderSize, quantity, supply, demand } = req.body;

    if (!brand || !cylinderSize || !quantity || supply === undefined || demand === undefined) {
      throw new AppError(400, "All fields are required");
    }

    const result = await pricingService.calculatePrice(
      brand,
      cylinderSize,
      quantity,
      supply,
      demand
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Price calculated",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getPricingHistory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { brand } = req.params;

    if (!brand) {
      throw new AppError(400, "Brand is required");
    }

    // For now, return empty array (implement full history later)
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Pricing history retrieved",
      data: [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function recordSnapshot(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { brand, cylinderSize, supplyKg, demandKg, pricePerKg, rebatePercentage } = req.body;

    if (!brand || !cylinderSize || supplyKg === undefined || demandKg === undefined) {
      throw new AppError(400, "All fields are required");
    }

    const result = await pricingService.recordSnapshot(
      brand,
      cylinderSize,
      supplyKg,
      demandKg,
      pricePerKg,
      rebatePercentage
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Price snapshot recorded",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}