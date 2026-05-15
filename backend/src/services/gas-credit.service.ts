import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, gte } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class GasCreditService {
  async checkEligibility(customerId: number) {
    try {
      // Check 1: 3+ orders in last 45 days
      const fortyFiveDaysAgo = new Date();
      fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

      const recentOrders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.customer_id, customerId));

      const qualifyingOrders = recentOrders.filter(
        (order) => order.created_at >= fortyFiveDaysAgo
      ).length;

      if (qualifyingOrders < 3) {
        return {
          eligible: false,
          reason: `Need 3+ orders in last 45 days. You have ${qualifyingOrders}`,
        };
      }

      // Check 2: Minimum CGC balance
      const cgcRecords = await db
        .select()
        .from(schema.cgcTokens)
        .where(eq(schema.cgcTokens.customer_id, customerId));

      const cgcBalance = cgcRecords.reduce((sum, record) => {
        if (record.redeemed_at) return sum;
        return sum + parseFloat(record.amount);
      }, 0);

      const minimumCGC = 100; // Minimum 100 KES equivalent
      if (cgcBalance < minimumCGC) {
        return {
          eligible: false,
          reason: `Need minimum ${minimumCGC} KES CGC. You have ${cgcBalance}`,
        };
      }

      // Check 3: No previous defaults (simplified - check status)
      const previousLoans = await db
        .select()
        .from(schema.gasCredit)
        .where(eq(schema.gasCredit.customer_id, customerId));

      const hasDefault = previousLoans.some((loan) => loan.status === "defaulted");
      if (hasDefault) {
        return {
          eligible: false,
          reason: "You have a defaulted loan on record",
        };
      }

      return { eligible: true, reason: "You qualify for gas credit" };
    } catch (error) {
      throw error;
    }
  }

  async applyForCredit(customerId: number, loanAmount: number) {
    try {
      // Check eligibility
      const eligibility = await this.checkEligibility(customerId);
      if (!eligibility.eligible) {
        throw new AppError(403, eligibility.reason);
      }

      // Get CBR from environment (simplified - assume 12%)
      const CBR = 12;
      const interestRate = CBR + 4; // 16%

      // Calculate repayment schedule (3 months)
      const schedule = this.calculateRepaymentSchedule(loanAmount, interestRate, 3);

      const newLoan = await db
        .insert(schema.gasCredit)
        .values({
          customer_id: customerId,
          amount: loanAmount.toString(),
          interest_rate: interestRate.toString(),
          status: "active",
          repayment_balance: (loanAmount * (1 + interestRate / 100)).toString(),
          repayment_schedule: JSON.stringify(schedule),
        })
        .returning();

      return {
        loanId: newLoan[0].id,
        amount: loanAmount,
        interestRate,
        totalRepayment: loanAmount * (1 + interestRate / 100),
        schedule,
      };
    } catch (error) {
      throw error;
    }
  }

  calculateRepaymentSchedule(
    amount: number,
    interestRate: number,
    months: number
  ) {
    const totalRepayment = amount * (1 + interestRate / 100);
    const monthlyPayment = totalRepayment / months;

    const schedule = [];
    for (let i = 1; i <= months; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        month: i,
        amount: monthlyPayment,
        dueDate: dueDate.toISOString(),
        paid: false,
      });
    }

    return schedule;
  }

  async recordRepayment(loanId: number, amountPaid: number) {
    try {
      const loan = await db
        .select()
        .from(schema.gasCredit)
        .where(eq(schema.gasCredit.id, loanId));

      if (loan.length === 0) {
        throw new AppError(404, "Loan not found");
      }

      const newBalance =
        parseFloat(loan[0].repayment_balance) - amountPaid;

      const updated = await db
        .update(schema.gasCredit)
        .set({
          repayment_balance: Math.max(0, newBalance).toString(),
          status: newBalance <= 0 ? "repaid" : "active",
        })
        .where(eq(schema.gasCredit.id, loanId))
        .returning();

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  async getBalance(customerId: number) {
    try {
      const loans = await db
        .select()
        .from(schema.gasCredit)
        .where(eq(schema.gasCredit.customer_id, customerId));

      const activeLoans = loans.filter((loan) => loan.status === "active");

      const totalOwed = activeLoans.reduce(
        (sum, loan) => sum + parseFloat(loan.repayment_balance),
        0
      );

      return {
        customerId,
        totalOwed,
        activeLoans: activeLoans.length,
      };
    } catch (error) {
      throw error;
    }
  }

  async getRepaymentSchedule(loanId: number) {
    try {
      const loan = await db
        .select()
        .from(schema.gasCredit)
        .where(eq(schema.gasCredit.id, loanId));

      if (loan.length === 0) {
        throw new AppError(404, "Loan not found");
      }

      return loan[0].repayment_schedule;
    } catch (error) {
      throw error;
    }
  }
}

export const gasCreditService = new GasCreditService();