import express from "express";
import * as pricingController from "../controllers/pricing.controller";
import { authenticateToken } from "../middleware/auth";
import { checkRole } from "../middleware/roleCheck";

const router = express.Router();

// GET /api/pricing/current
router.get("/current", authenticateToken, pricingController.getCurrentPrice);

// POST /api/pricing/calculate
router.post("/calculate", authenticateToken, pricingController.calculatePrice);

// GET /api/pricing/history/:brand
router.get("/history/:brand", authenticateToken, pricingController.getPricingHistory);

// POST /api/pricing/snapshot (admin only)
router.post(
  "/snapshot",
  authenticateToken,
  checkRole(["admin"]),
  pricingController.recordSnapshot
);

export default router;