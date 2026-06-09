// backend/src/controllers/settlement.controller.ts

import { Request, Response, NextFunction } from 'express';
import { settlementService } from '../services/settlement.service';
import { runSettlementNow } from '../jobs/settlement-scheduler';
import { AppError } from '../middleware/errorHandler';

/**
 * Manual trigger: Run settlement now
 * POST /api/settlement/run
 */
export async function runSettlement(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError(403, 'Only admins can trigger settlement');
    }

    console.log('🚀 Admin triggered settlement');
    const summary = await runSettlementNow();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Settlement executed',
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get settlement cycle summary
 * GET /api/settlement/cycles/:cycleId
 */
export async function getSettlementSummary(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { cycleId } = req.params;

    const summary = await settlementService.getSettlementSummary(
      parseInt(cycleId as string)
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Settlement summary retrieved',
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all settlement cycles
 * GET /api/settlement/cycles?status=settled&limit=10
 */
export async function listSettlementCycles(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // TODO: Query settlement_cycles table with filters
    // For now, return mock

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Settlement cycles retrieved',
      data: {
        cycles: [
          {
            id: 1,
            cycleNumber: 1,
            status: 'settled',
            totalNetValue: 150000,
            settledAt: '2024-01-01T22:00:00Z',
          },
        ],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}