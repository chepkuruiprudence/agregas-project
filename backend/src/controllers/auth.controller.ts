import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { AppError } from "../middleware/errorHandler";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password, fullName, phone, role, ...extraFields } = req.body;

    console.log('📝 Register request received:', {
      email,
      fullName,
      role,
      extraFieldKeys: Object.keys(extraFields),
    });

    // Validate required fields
    if (!email || !password || !fullName) {
      throw new AppError(400, "Email, password, and fullName are required");
    }

    if (!role) {
      throw new AppError(400, "Role is required");
    }

    // Validate role is one of allowed values
    const validRoles = ['customer', 'retailer', 'brand_marketer'];
    if (!validRoles.includes(role)) {
      throw new AppError(
        400,
        `Invalid role. Must be one of: ${validRoles.join(', ')}`
      );
    }

    // ✅ PASS role AND extra fields to service
    const result = await authService.register(
      email,
      password,
      fullName,
      phone,
      role,
      extraFields // ✅ Pass all role-specific fields
    );

    console.log('✓ Registration successful:', {
      userId: result.user.id,
      role: result.user.role,
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "User registered successfully",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, "Email and password are required");
    }

    const result = await authService.login(email, password);

    console.log('✓ Login successful:', {
      userId: result.user.id,
      role: result.user.role,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Login successful",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const newToken = authService.generateJWT(
      req.user.userId,
      req.user.email,
      req.user.role
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Token refreshed",
      data: { token: newToken },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Logged out successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}