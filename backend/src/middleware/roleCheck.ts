import { Request, Response, NextFunction } from "express";

export function checkRole(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "User not authenticated",
        timestamp: new Date().toISOString(),
      });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: `Access denied. Required role: ${requiredRoles.join(" or ")}`,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}