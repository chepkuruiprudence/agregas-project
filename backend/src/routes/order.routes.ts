import express from "express";
import * as orderController from "../controllers/order.controller";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// POST /api/orders/create
router.post("/create", authenticateToken, orderController.createOrder);

// GET /api/orders/:id
router.get("/:id", authenticateToken, orderController.getOrderById);

// GET /api/orders/customer/list
router.get("/customer/list", authenticateToken, orderController.getCustomerOrders);

// PUT /api/orders/:id/status
router.put("/:id/status", authenticateToken, orderController.updateOrderStatus);

// DELETE /api/orders/:id
router.delete("/:id", authenticateToken, orderController.cancelOrder);

export default router;