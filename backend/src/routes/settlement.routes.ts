// backend/src/routes/settlement.routes.ts

import express from 'express';
import * as settlementController from '../controllers/settlement.controller';
import { authenticateToken } from '../middleware/auth';
import { checkRole } from '../middleware/roleCheck';

const router = express.Router();

/**
 * Admin endpoints
 */
router.post(
  '/run',
  authenticateToken,
  checkRole(['admin']),
  settlementController.runSettlement
);

router.get(
  '/cycles',
  authenticateToken,
  settlementController.listSettlementCycles
);

router.get(
  '/cycles/:cycleId',
  authenticateToken,
  settlementController.getSettlementSummary
);

export default router;