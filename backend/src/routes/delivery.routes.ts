import express from "express";
import * as deliveryController from "../controllers/delivery.controller";
import { authenticateToken } from "../middleware/auth";
import { checkRole } from "../middleware/roleCheck";

const router = express.Router();

// GET /api/delivery/:orderId
router.get("/:orderId", authenticateToken, deliveryController.getDeliveryStatus);

// POST /api/delivery/update-position (driver)
router.post(
  "/update-position",
  authenticateToken,
  checkRole(["retailer"]),
  deliveryController.updatePosition
);

// PUT /api/delivery/:orderId/complete (driver)
router.put(
  "/:orderId/complete",
  authenticateToken,
  checkRole(["retailer"]),
  deliveryController.completeDelivery
);

export default router;