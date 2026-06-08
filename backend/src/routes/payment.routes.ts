import express from "express";
import * as paymentController from "../controllers/payment.controller";
import { authenticateToken } from "../middleware/auth";
import { checkRole } from "../middleware/roleCheck";

const router = express.Router();

/**
 * POST /api/payments/initiate
 * Start payment process (basic acknowledgment)
 * Customer only
 */
router.post(
  "/initiate",
  authenticateToken,
  checkRole(["customer"]),
  paymentController.initiatePayment
);

/**
 * POST /api/payments/process
 * Main payment endpoint (creates ledger entries)
 * CRITICAL ENDPOINT
 * 
 * Request:
 * {
 *   orderId: 123,
 *   amount: 3000,
 *   paymentMethod: "mpesa" | "card" | "cash",
 *   phoneNumber?: "254712345678"
 * }
 * 
 * Response includes:
 * - transactionId (idempotency key)
 * - walletBalances (derived from ledger)
 * - nextSteps (what happens next)
 */
router.post(
  "/process",
  authenticateToken,
  checkRole(["customer"]),
  paymentController.processPayment
);

/**
 * POST /api/payments/confirm
 * Confirm payment from gateway (M-Pesa callback, Stripe webhook, etc)
 * Can be called by external services or internal
 * 
 * Request:
 * {
 *   transactionId: "tx-123-456",
 *   orderId: 123,
 *   status: "success" | "failed",
 *   gateway: "mpesa" | "stripe" | "flutterwave"
 * }
 */
router.post("/confirm", paymentController.confirmPayment); // No auth - can be from external gateway

/**
 * GET /api/payments/status/:orderId
 * Get payment status and history for an order
 */
router.get(
  "/status/:orderId",
  authenticateToken,
  paymentController.getPaymentStatus
);

/**
 * POST /api/payments/refund
 * Initiate refund (creates reversing ledger entries)
 */
router.post(
  "/refund",
  authenticateToken,
  checkRole(["customer", "admin"]),
  paymentController.refundPayment
);

export default router;