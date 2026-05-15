import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export function validateRequest(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      const errors = error.errors.map((err: any) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors,
        timestamp: new Date().toISOString(),
      });
    }
  };
}