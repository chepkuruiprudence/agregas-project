import express from "express";
import * as cgcController from "../controllers/cgc.controller";
import { authenticateToken } from "../middleware/auth";
import { checkRole } from "../middleware/roleCheck";

const router = express.Router();

// POST /api/cgc/earn (internal/admin)
router.post(
  "/earn",
  authenticateToken,
  checkRole(["admin"]),
  cgcController.earnCGC
);

// POST /api/cgc/redeem
router.post("/redeem", authenticateToken, cgcController.redeemCGC);

// GET /api/cgc/balance/:customerId
router.get("/balance/:customerId", authenticateToken, cgcController.getBalance);

// GET /api/cgc/history/me (CGC earn/redeem history for the caller)
router.get("/history/me", authenticateToken, cgcController.getHistory);

// GET /api/cgc/revenue (admin)
router.get(
  "/revenue",
  authenticateToken,
  checkRole(["admin"]),
  cgcController.getCarbonRevenue
);

export default router;