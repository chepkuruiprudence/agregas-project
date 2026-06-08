import express from "express";
import { authenticateToken } from "../middleware/auth";
import { checkRole } from "../middleware/roleCheck";
import {
  getBrandStats,
  getBrandProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getBrandRetailers,
  getBrandAnalytics,
  updatePricing,
  getRetailerPerformance,
} from "../controllers/brand.controller";

const router = express.Router();

/**
 * All brand routes require authentication and brandrole
 */
router.use(authenticateToken);
router.use(checkRole(["brand"]));

/**
 * Dashboard Statistics
 */
router.get("/stats", getBrandStats);

/**
 * Product Management
 */
router.get("/products", getBrandProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

/**
 * Retailer Management
 */
router.get("/retailers", getBrandRetailers);
router.get("/performance/:retailerId", getRetailerPerformance);

/**
 * Pricing & Analytics
 */
router.get("/analytics", getBrandAnalytics);
router.put("/pricing", updatePricing);

export default router;