import { Request, Response, NextFunction } from "express";
import { subscriptionService } from "../services/subscription.service";
import { AppError } from "../middleware/errorHandler";

export async function createSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { tier, depositAmount } = req.body;

    if (!tier || !depositAmount) {
      throw new AppError(400, "Tier and depositAmount are required");
    }

    const subscription = await subscriptionService.createSubscription(
      req.user.userId,
      tier,
      depositAmount
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Subscription created",
      data: subscription,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, "Subscription ID is required");
    }

    const subscription = await subscriptionService.getSubscription(parseInt(id as string));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Subscription retrieved",
      data: subscription,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function renewSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, "Subscription ID is required");
    }

    const renewed = await subscriptionService.renewSubscription(parseInt(id as string));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Subscription renewed",
      data: renewed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, "Subscription ID is required");
    }

    const cancelled = await subscriptionService.cancelSubscription(parseInt(id as string));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Subscription cancelled",
      data: cancelled,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}