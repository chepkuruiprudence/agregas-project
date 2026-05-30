import express from "express";
import * as orderController from "../controllers/order.controller";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

/**
 * CRITICAL: Route order matters!
 * More SPECIFIC routes must come BEFORE generic ones
 * Otherwise GET /orders/customer gets matched to GET /orders/:id
 */

// ✅ SPECIFIC routes first
router.post("/create", authenticateToken, orderController.createOrder);
router.get("/customer", authenticateToken, orderController.getCustomerOrders); // ✅ NO /list

// ✅ GENERIC routes last
router.get("/:id", authenticateToken, orderController.getOrderById);
router.put("/:id/status", authenticateToken, orderController.updateOrderStatus);
router.delete("/:id", authenticateToken, orderController.cancelOrder);

export default router;