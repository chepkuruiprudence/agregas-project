// backend/src/routes/auth.routes.ts

import express from "express";
import * as authController from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";
import cookieParser from "cookie-parser";

const router = express.Router();

// Middleware
router.use(cookieParser());

// 1. Email signup + OTP
router.post("/signup", authController.signupWithEmail);
router.post("/verify-otp", authController.verifyOTP);
router.post("/resend-otp", authController.resendOTP);

// 2. Google OAuth
router.post("/google/callback", authController.googleOAuthCallback);

// 3. Traditional login
router.post("/login", authController.login);

// 4. Password reset
router.post("/forgot-password", authController.requestPasswordReset);
router.post("/reset-password", authController.resetPassword);

// 5. Token management
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);

// 6. Passkeys (WebAuthn)
router.post("/passkey/register", authenticateToken, authController.registerPasskey);
router.post("/passkey/authenticate", authController.authenticatePasskey);

export default router;