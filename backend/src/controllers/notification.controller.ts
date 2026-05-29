import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { AppError } from "../middleware/errorHandler";

export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const notifications = await notificationService.getNotifications(
      req.user.userId,
      limit
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Notifications retrieved",
      data: notifications,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, "Notification ID is required");
    }

    const updated = await notificationService.markAsRead(parseInt(id as string));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Notification marked as read",
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const count = await notificationService.getUnreadCount(req.user.userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Unread count retrieved",
      data: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, "Notification ID is required");
    }

    const result = await notificationService.deleteNotification(parseInt(id as string));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Notification deleted",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}