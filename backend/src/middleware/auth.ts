import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "No token provided",
        timestamp: new Date().toISOString(),
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as JwtPayload;

    console.log('✓ Token verified for user:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: "Invalid or expired token",
      timestamp: new Date().toISOString(),
    });
  }
}