import { Request, Response, NextFunction } from "express";
import { brandService } from "../services/brand.service";
import { AppError } from "../middleware/errorHandler";

export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { brand } = req.query;

    if (!brand) {
      throw new AppError(400, "Brand is required");
    }

    const products = await brandService.getBrandProducts(brand as string);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Brand products retrieved",
      data: products,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function setBasePrice(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params;
    const { newPrice } = req.body;

    if (!productId || !newPrice) {
      throw new AppError(400, "Product ID and new price are required");
    }

    const updated = await brandService.setBasePrice(parseInt(productId), newPrice);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Base price updated",
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRetailers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { brand } = req.query;

    if (!brand) {
      throw new AppError(400, "Brand is required");
    }

    const retailers = await brandService.getBrandRetailers(brand as string);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Brand retailers retrieved",
      data: retailers,
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
    const { brand } = req.query;

    if (!brand) {
      throw new AppError(400, "Brand is required");
    }

    const analytics = await brandService.getBrandAnalytics(brand as string);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Brand analytics retrieved",
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}