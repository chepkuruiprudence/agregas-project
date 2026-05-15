import express from "express";
import * as adminController from "../controllers/admin.controller";
import { authenticateToken } from "../middleware/auth";
import { checkRole } from "../middleware/roleCheck";

const router = express.Router();

// GET /api/admin/users
router.get(
  "/users",
  authenticateToken,
  checkRole(["admin"]),
  adminController.getAllUsers
);

// PUT /api/admin/users/:userId/role
router.put(
  "/users/:userId/role",
  authenticateToken,
  checkRole(["admin"]),
  adminController.changeUserRole
);

// PUT /api/admin/users/:userId/status
router.put(
  "/users/:userId/status",
  authenticateToken,
  checkRole(["admin"]),
  adminController.deactivateUser
);

// GET /api/admin/analytics
router.get(
  "/analytics",
  authenticateToken,
  checkRole(["admin"]),
  adminController.getAnalytics
);

// PUT /api/admin/settings
router.put(
  "/settings",
  authenticateToken,
  checkRole(["admin"]),
  adminController.updateSettings
);

export default router;