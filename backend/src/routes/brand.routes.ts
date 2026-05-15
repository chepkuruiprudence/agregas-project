import express from "express";
import * as brandController from "../controllers/brand.controller";
import { authenticateToken } from "../middleware/auth";
import { checkRole } from "../middleware/roleCheck";

const router = express.Router();

// GET /api/brand/products
router.get(
  "/products",
  authenticateToken,
  checkRole(["brand_marketer"]),
  brandController.getProducts
);

// PUT /api/brand/products/:productId/price
router.put(
  "/products/:productId/price",
  authenticateToken,
  checkRole(["brand_marketer"]),
  brandController.setBasePrice
);

// GET /api/brand/retailers
router.get(
  "/retailers",
  authenticateToken,
  checkRole(["brand_marketer"]),
  brandController.getRetailers
);

// GET /api/brand/analytics
router.get(
  "/analytics",
  authenticateToken,
  checkRole(["brand_marketer"]),
  brandController.getAnalytics
);

export default router;