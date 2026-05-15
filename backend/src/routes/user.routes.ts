import express from "express";
import * as userController from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// GET /api/users/profile
router.get("/profile", authenticateToken, userController.getProfile);

// PUT /api/users/profile
router.put("/profile", authenticateToken, userController.updateProfile);

export default router;