import express from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// GET /api/notifications/:userId
router.get("/:userId", authenticateToken, notificationController.getNotifications);

// PUT /api/notifications/:id/read
router.put("/:id/read", authenticateToken, notificationController.markAsRead);

// DELETE /api/notifications/:id
router.delete("/:id", authenticateToken, notificationController.deleteNotification);

// GET /api/notifications/:userId/unread
router.get("/:userId/unread", authenticateToken, notificationController.getUnreadCount);

export default router;