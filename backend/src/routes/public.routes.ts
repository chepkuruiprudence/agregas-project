import express from "express";
import { getAllBrands } from "../controllers/brand.controller";

const router = express.Router();

/**
 * PUBLIC endpoints - No authentication required
 * Used for customer-facing features (order forms, etc)
 */

/**
 * GET /api/brands
 * Get all brands for order creation dropdown
 * No auth required - public endpoint
 */
router.get("/", getAllBrands);

export default router;