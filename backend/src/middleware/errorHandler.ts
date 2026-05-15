import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      statusCode: error.statusCode,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: error.message || "Internal server error",
    timestamp: new Date().toISOString(),
  });
}