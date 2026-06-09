// backend/src/jobs/settlement-scheduler.ts

import cron from 'node-cron';
import { settlementService } from '../services/settlement.service';

/**
 * Run settlement at specific times
 * Examples:
 * '0 22 * * *' = Every day at 22:00 (10 PM)
 * '0 0 * * *' = Every day at 00:00 (midnight)
 **/
export function startSettlementScheduler() {
  console.log('📅 Starting settlement scheduler...');

  // Run at 22:00 every day
  cron.schedule('0 22 * * *', async () => {
    try {
      console.log('⏰ Settlement cycle triggered (22:00)');

      // Create cycle
      const cycle = await settlementService.createSettlementCycle();

      // Create obligations
      const obligations = await settlementService.createSettlementObligations(
        cycle.id
      );

      // Execute settlement
      if (process.env.AUTO_SETTLE === 'true') {
        await settlementService.executeSettlement(cycle.id);
      } else {
        console.log(
          'ℹ️  AUTO_SETTLE disabled. Manual settlement required via API.'
        );
      }
    } catch (error) {
      console.error('❌ Settlement scheduler error:', error);
      // TODO: Send alert to admin
    }
  });

  console.log('✓ Settlement scheduler started (runs at 22:00 daily)');
}

/**
 * Alternative: Manual trigger via API
 * POST /api/settlement/cycle/run
 */
export async function runSettlementNow() {
  try {
    console.log('🚀 Running settlement NOW (manual trigger)');

    const cycle = await settlementService.createSettlementCycle();
    const obligations = await settlementService.createSettlementObligations(
      cycle.id
    );
    await settlementService.executeSettlement(cycle.id);

    return await settlementService.getSettlementSummary(cycle.id);
  } catch (error) {
    throw error;
  }
}