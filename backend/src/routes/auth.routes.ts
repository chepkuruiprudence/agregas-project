import express from "express";
import * as authController from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// POST /api/auth/register
router.post("/register", authController.register);

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/refresh
router.post("/refresh", authenticateToken, authController.refreshToken);

// POST /api/auth/logout
router.post("/logout", authenticateToken, authController.logout);

export default router;