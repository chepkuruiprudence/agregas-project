import express from "express";
import * as loyaltyController from "../controllers/loyalty.controller";
import { authenticateToken } from "../middleware/auth";
import { checkRole } from "../middleware/roleCheck";

const router = express.Router();

// POST /api/loyalty/earn (internal/admin)
router.post(
  "/earn",
  authenticateToken,
  checkRole(["admin"]),
  loyaltyController.earnPoints
);

// POST /api/loyalty/redeem
router.post("/redeem", authenticateToken, loyaltyController.redeemPoints);

// GET /api/loyalty/balance/:customerId
router.get("/balance/:customerId", authenticateToken, loyaltyController.getBalance);

// GET /api/loyalty/history/:customerId
router.get("/history/:customerId", authenticateToken, loyaltyController.getHistory);

export default router;