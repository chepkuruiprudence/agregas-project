// backend/src/controllers/brand.controller.ts

import { Request, Response, NextFunction } from "express";
import { brandService } from "../services/brand.service";
import { AppError } from "../middleware/errorHandler";

/**
 * GET /api/brands
 * Public endpoint: Returns all registered gas brands for customer order creation
 */
export async function getAllBrands(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const brands = await brandService.getAllBrands();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Brands retrieved successfully",
      data: brands,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/by-brand/:brandName
 * Public endpoint: Returns active products for a specific brand
 */
export async function getProductsByBrand(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { brandName } = req.params;

    if (!brandName) {
      throw new AppError(400, "Brand name parameter is required");
    }

    const products = await brandService.getProductsByBrand(brandName as string);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Products retrieved for brand: ${brandName}`,
      data: products,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /brand/stats
 * Returns dashboard statistics for the logged-in brand marketer
 */
export async function getBrandStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const stats = await brandService.getBrandStats(req.user.userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Brand statistics retrieved",
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /brand/products
 * Returns all products created by the brand
 */
export async function getBrandProducts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const products = await brandService.getBrandProducts(req.user.userId);

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

/**
 * POST /brand/products
 * Create a new product for the brand
 */
export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { name, cylinderSize, basePrice, category, description } = req.body;

    if (!name || !cylinderSize || !basePrice || !category) {
      throw new AppError(400, "Required fields: name, cylinderSize, basePrice, category");
    }

    const product = await brandService.createProduct(req.user.userId, {
      name,
      cylinderSize,
      basePrice,
      category,
      description,
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Product created successfully",
      data: product,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /brand/products/:id
 * Update a product
 */
export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { id } = req.params;
    const { name, basePrice, category, description, isActive } = req.body;

    const product = await brandService.updateProduct(req.user.userId, parseInt(id as string), {
      name,
      basePrice,
      category,
      description,
      isActive,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Product updated successfully",
      data: product,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /brand/products/:id
 * Delete a product
 */
export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { id } = req.params;

    await brandService.deleteProduct(req.user.userId, parseInt(id as string));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Product deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /brand/retailers
 * Returns all retailers carrying brand products
 */
export async function getBrandRetailers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const retailers = await brandService.getBrandRetailers(req.user.userId);

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

/**
 * GET /brand/analytics
 * Returns detailed analytics for the brand
 */
export async function getBrandAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { period = 'monthly' } = req.query;

    const analytics = await brandService.getBrandAnalytics(
      req.user.userId,
      period as string
    );

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

/**
 * PUT /brand/pricing
 * Update product pricing (affects supply-demand ratio)
 */
export async function updatePricing(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { productId, newBasePrice, reason } = req.body;

    if (!productId || !newBasePrice) {
      throw new AppError(400, "Required fields: productId, newBasePrice");
    }

    const result = await brandService.updatePricing(
      req.user.userId,
      productId,
      newBasePrice,
      reason
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Pricing updated successfully",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /brand/performance/:retailerId
 * Returns detailed performance metrics for a specific retailer
 */
export async function getRetailerPerformance(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { retailerId } = req.params;

    const performance = await brandService.getRetailerPerformance(
      req.user.userId,
      parseInt(retailerId as string)
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Retailer performance retrieved",
      data: performance,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}