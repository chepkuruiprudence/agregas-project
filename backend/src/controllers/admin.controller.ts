import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { analyticsService } from "../services/analytics.service";
import { AppError } from "../middleware/errorHandler";

export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = (page - 1) * limit;

    const users = await userService.getAllUsers(limit, offset);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "All users retrieved",
      data: users,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function changeUserRole(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;

    if (!userId || !newRole) {
      throw new AppError(400, "User ID and new role are required");
    }

    const updated = await userService.changeUserRole(parseInt(userId), newRole);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "User role updated",
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError(400, "User ID is required");
    }

    const updated = await userService.deactivateUser(parseInt(userId));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "User deactivated",
      data: updated,
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
    const metrics = await analyticsService.getPlatformMetrics();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Platform analytics retrieved",
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { cbrRate, rolloverPercentage, loyaltyMultiplier } = req.body;

    // For now, just return success (implement actual settings storage later)
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Settings updated",
      data: {
        cbrRate: cbrRate || 12,
        rolloverPercentage: rolloverPercentage || 20,
        loyaltyMultiplier: loyaltyMultiplier || 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}