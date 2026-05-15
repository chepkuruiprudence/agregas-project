import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { AppError } from "../middleware/errorHandler";

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const user = await userService.getUserById(req.user.userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Profile retrieved",
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { fullName, phone } = req.body;

    const updated = await userService.updateUser(req.user.userId, {
      full_name: fullName,
      phone,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Profile updated",
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}