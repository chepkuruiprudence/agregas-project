// import express from "express";
// import * as brandController from "../controllers/brand.controller";
// import { authenticateToken } from "../middleware/auth";
// import { checkRole } from "../middleware/roleCheck";

// const router = express.Router();

// // GET /api/brand/products
// router.get(
//   "/products",
//   authenticateToken,
//   checkRole(["brand_marketer"]),
//   brandController.getProducts
// );

// // PUT /api/brand/products/:productId/price
// router.put(
//   "/products/:productId/price",
//   authenticateToken,
//   checkRole(["brand_marketer"]),
//   brandController.setBasePrice
// );

// // GET /api/brand/retailers
// router.get(
//   "/retailers",
//   authenticateToken,
//   checkRole(["brand_marketer"]),
//   brandController.getRetailers
// );

// // GET /api/brand/analytics
// router.get(
//   "/analytics",
//   authenticateToken,
//   checkRole(["brand_marketer"]),
//   brandController.getAnalytics
// );

// export default router;

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
 * All brand routes require authentication and brand_marketer role
 */
router.use(authenticateToken);
router.use(checkRole(["brand_marketer"]));

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