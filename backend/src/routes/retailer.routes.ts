import express from "express";
import * as retailerController from "../controllers/retailer.controller";
import { authenticateToken } from "../middleware/auth";
import { checkRole } from "../middleware/roleCheck";

const router = express.Router();

// GET /api/retailer/inventory/:retailerId
router.get(
  "/inventory/:retailerId",
  authenticateToken,
  checkRole(["retailer"]),
  retailerController.getInventory
);

// PUT /api/retailer/inventory/:retailerId
router.put(
  "/inventory/:retailerId",
  authenticateToken,
  checkRole(["retailer"]),
  retailerController.updateInventory
);

// GET /api/retailer/orders/pending/:retailerId
router.get(
  "/orders/pending/:retailerId",
  authenticateToken,
  checkRole(["retailer"]),
  retailerController.getPendingOrders
);

// PUT /api/retailer/orders/:retailerId/:orderId/accept
router.put(
  "/orders/:retailerId/:orderId/accept",
  authenticateToken,
  checkRole(["retailer"]),
  retailerController.acceptOrder
);

// PUT /api/retailer/orders/:retailerId/:orderId/reject
router.put(
  "/orders/:retailerId/:orderId/reject",
  authenticateToken,
  checkRole(["retailer"]),
  retailerController.rejectOrder
);

// GET /api/retailer/analytics/:retailerId
router.get(
  "/analytics/:retailerId",
  authenticateToken,
  checkRole(["retailer"]),
  retailerController.getAnalytics
);

export default router;