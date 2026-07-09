// backend/src/routes/retailer.routes.ts
import express from "express";
import * as retailerController from "../controllers/retailer.controller";
import { authenticateToken } from "../middleware/auth";
import { checkRole } from "../middleware/roleCheck";

const router = express.Router();

const isRetailer = [authenticateToken, checkRole(["retailer"])];

// ── Dashboard endpoints (called by RetailerDashboard.tsx) ────────────────────
// GET  /api/retailer/stats          → active orders, stock, today sales, rating
// GET  /api/retailer/orders         → last 5 orders for this retailer
// GET  /api/retailer/inventory      → inventory items for this retailer
// GET  /api/retailer/mpesa-settings → saved M-Pesa phone
// PUT  /api/retailer/mpesa-settings → save M-Pesa phone

router.get("/stats",          ...isRetailer, retailerController.getStats);
router.get("/orders",         ...isRetailer, retailerController.getOrders);
router.get("/inventory",      ...isRetailer, retailerController.getInventory);
router.get("/mpesa-settings", ...isRetailer, retailerController.getMPesaSettings);
router.put("/mpesa-settings", ...isRetailer, retailerController.saveMPesaSettings);

// ── Existing parameterised endpoints ────────────────────────────────────────
router.get( "/inventory/:retailerId",                    ...isRetailer, retailerController.getInventoryById);
router.put( "/inventory/:retailerId",                    ...isRetailer, retailerController.updateInventory);
router.get( "/orders/pending/:retailerId",               ...isRetailer, retailerController.getPendingOrders);
router.put( "/orders/:retailerId/:orderId/accept",       ...isRetailer, retailerController.acceptOrder);
router.put( "/orders/:retailerId/:orderId/reject",       ...isRetailer, retailerController.rejectOrder);
router.get( "/analytics/:retailerId",                    ...isRetailer, retailerController.getAnalytics);

export default router;