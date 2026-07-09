// backend/src/controllers/auth.controller.ts

import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { AppError } from "../middleware/errorHandler";

/**
 * 1. SIGNUP with email verification
 */
export async function signupWithEmail(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password, fullName, phone, role } = req.body;

    if (!email || !password || !fullName || !role) {
      throw new AppError(400, "Missing required fields");
    }

    const result = await authService.registerWithEmailVerification(
      email,
      password,
      fullName,
      phone,
      role
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: result.message,
      data: {
        verificationId: result.verificationId,
        email: result.email,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. VERIFY OTP and complete signup
 */
export async function verifyOTP(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, otpCode, password, fullName, phone, role, extraFields } = req.body;

    if (!email || !otpCode || !password || !fullName || !role) {
      throw new AppError(400, "Missing required fields");
    }

    const result = await authService.verifyOTPAndCompleteSignup(
      email,
      otpCode,
      password,
      fullName,
      phone,
      role,
      extraFields
    );

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Account created and verified successfully",
      data: {
        token: result.token,
        user: result.user,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. RESEND OTP
 */
export async function resendOTP(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError(400, "Email is required");
    }

    // TODO: Implement resend OTP logic
    // Generate new OTP and send email

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "OTP resent to your email",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. GOOGLE OAUTH CALLBACK
 */
export async function googleOAuthCallback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { googleProfile } = req.body;

    if (!googleProfile) {
      throw new AppError(400, "Google profile is required");
    }

    const result = await authService.googleOAuthLogin(googleProfile);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(result.isNewUser ? 201 : 200).json({
      success: true,
      statusCode: result.isNewUser ? 201 : 200,
      message: result.isNewUser ? "Account created" : "Logged in successfully",
      data: {
        token: result.token,
        user: result.user,
        isNewUser: result.isNewUser,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 5. TRADITIONAL LOGIN
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password, rememberMe = false } = req.body;

    if (!email || !password) {
      throw new AppError(400, "Email and password are required");
    }

    const ipAddress = req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await authService.login(email, password, rememberMe, ipAddress, userAgent);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Login successful",
      data: {
        token: result.token,
        user: result.user,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 6. REQUEST PASSWORD RESET
 */
export async function requestPasswordReset(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError(400, "Email is required");
    }

    const result = await authService.requestPasswordReset(email);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 7. RESET PASSWORD with token
 */
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      throw new AppError(400, "Reset token and new password are required");
    }

    const result = await authService.resetPassword(resetToken, newPassword);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 8. REFRESH TOKEN
 */
export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { refreshToken: refreshTokenFromBody } = req.body;
    const cookieToken = req.cookies?.refreshToken;

    const token = refreshTokenFromBody || cookieToken;

    if (!token) {
      throw new AppError(401, "Refresh token is required");
    }

    const result = await authService.refreshAccessToken(token);

    // Update httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Token refreshed",
      data: {
        token: result.token,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 9. REGISTER PASSKEY
 */
export async function registerPasskey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { credentialId, publicKey, deviceName } = req.body;

    if (!credentialId || !publicKey) {
      throw new AppError(400, "Credential ID and public key are required");
    }

    const result = await authService.registerPasskey(
      req.user.userId,
      credentialId,
      publicKey,
      deviceName
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 10. AUTHENTICATE with PASSKEY
 */
export async function authenticatePasskey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { credentialId, counter } = req.body;

    if (!credentialId || counter === undefined) {
      throw new AppError(400, "Credential ID and counter are required");
    }

    const result = await authService.authenticatePasskey(credentialId, counter);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Passkey authentication successful",
      data: {
        token: result.token,
        user: result.user,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * LOGOUT
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

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