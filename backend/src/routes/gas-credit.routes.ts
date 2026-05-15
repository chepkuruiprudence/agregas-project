import express from "express";
import * as gasCreditController from "../controllers/gas-credit.controller";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// POST /api/gas-credit/check-eligibility
router.post(
  "/check-eligibility",
  authenticateToken,
  gasCreditController.checkEligibility
);

// POST /api/gas-credit/apply
router.post("/apply", authenticateToken, gasCreditController.applyForCredit);

// GET /api/gas-credit/balance/:customerId
router.get("/balance/:customerId", authenticateToken, gasCreditController.getBalance);

// POST /api/gas-credit/repay
router.post("/repay", authenticateToken, gasCreditController.recordRepayment);

// GET /api/gas-credit/schedule/:loanId
router.get("/schedule/:loanId", authenticateToken, gasCreditController.getRepaymentSchedule);

export default router;