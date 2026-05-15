import express from "express";
import * as subscriptionController from "../controllers/subscription.controller";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// POST /api/subscriptions/create
router.post("/create", authenticateToken, subscriptionController.createSubscription);

// GET /api/subscriptions/:id
router.get("/:id", authenticateToken, subscriptionController.getSubscription);

// PUT /api/subscriptions/:id/renew
router.put("/:id/renew", authenticateToken, subscriptionController.renewSubscription);

// PUT /api/subscriptions/:id/cancel
router.put("/:id/cancel", authenticateToken, subscriptionController.cancelSubscription);

export default router;