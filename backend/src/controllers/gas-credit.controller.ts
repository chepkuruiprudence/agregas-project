import { Request, Response, NextFunction } from "express";
import { gasCreditService } from "../services/gas-credit.service";
import { AppError } from "../middleware/errorHandler";

export async function checkEligibility(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const eligibility = await gasCreditService.checkEligibility(req.user.userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Eligibility checked",
      data: eligibility,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function applyForCredit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { loanAmount } = req.body;

    if (!loanAmount) {
      throw new AppError(400, "Loan amount is required");
    }

    const result = await gasCreditService.applyForCredit(
      req.user.userId,
      loanAmount
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Credit application submitted",
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

    const balance = await gasCreditService.getBalance(req.user.userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Gas credit balance retrieved",
      data: balance,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function recordRepayment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { loanId, amountPaid } = req.body;

    if (!loanId || !amountPaid) {
      throw new AppError(400, "Loan ID and amount are required");
    }

    const result = await gasCreditService.recordRepayment(loanId, amountPaid);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Repayment recorded",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRepaymentSchedule(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { loanId } = req.params;

    if (!loanId) {
      throw new AppError(400, "Loan ID is required");
    }

    const schedule = await gasCreditService.getRepaymentSchedule(parseInt(loanId));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Repayment schedule retrieved",
      data: schedule,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}