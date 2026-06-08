import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment.service";
import { AppError } from "../middleware/errorHandler";
import { v4 as uuidv4 } from "uuid"; // npm install uuid

export async function initiatePayment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { orderId, paymentMethod } = req.body;

    if (!orderId || !paymentMethod) {
      throw new AppError(400, "orderId and paymentMethod are required");
    }

    // Validate payment method
    const validMethods = ["mpesa", "card", "cash"];
    if (!validMethods.includes(paymentMethod)) {
      throw new AppError(400, "Invalid payment method");
    }

    // Here you would integrate with M-Pesa, Stripe, etc.
    // For now, just acknowledge the request

    res.status(202).json({
      success: true,
      statusCode: 202,
      message: "Payment initiated",
      data: {
        orderId,
        paymentMethod,
        status: "initiated",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MAIN PAYMENT ENDPOINT
 * This is called from PaymentPage when user clicks "Pay"
 * 
 * Request body:
 * {
 *   orderId: 123,
 *   amount: 3000,
 *   paymentMethod: "mpesa" | "card" | "cash",
 *   phoneNumber?: "254712345678" (M-Pesa)
 * }
 */
export async function processPayment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { orderId, amount, paymentMethod, phoneNumber } = req.body;

    // Validation
    if (!orderId || !amount || !paymentMethod) {
      throw new AppError(
        400,
        "orderId, amount, and paymentMethod are required"
      );
    }

    if (isNaN(amount) || amount <= 0) {
      throw new AppError(400, "amount must be a positive number");
    }

    // Idempotency: use a stable transaction ID
    // In production, you'd use the request's Idempotency-Key header
    const idempotencyKey =
      req.headers["idempotency-key"] || `tx-${orderId}-${Date.now()}`;

    console.log(
      `💳 Processing ${paymentMethod} payment for order ${orderId}, amount ${amount} KES`
    );

    // Call payment service (handles ledger, wallets, etc)
    const result = await paymentService.processPayment({
      orderId,
      customerId: req.user.userId,
      amount,
      paymentMethod: paymentMethod as "mpesa" | "card" | "cash",
      idempotencyKey: String(idempotencyKey),
    });

    // STEP 1: If it's a duplicate, return cached result
    if (result.isDuplicate) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Payment already processed (idempotent)",
        data: result,
        timestamp: new Date().toISOString(),
      });
    }

    // STEP 2: If it's M-Pesa, initiate STK Push or API call
    if (paymentMethod === "mpesa") {
      // TODO: Call Daraja API here
      // For now, just acknowledge
      console.log(
        `📱 M-Pesa: would send STK to ${phoneNumber || "registered phone"}`
      );
    }

    // STEP 3: If it's card, redirect to Stripe/Flutterwave
    if (paymentMethod === "card") {
      // TODO: Create Stripe session here
      console.log(`💳 Card: would create payment session`);
    }

    // STEP 4: If it's cash, mark as pending until retailer confirms
    if (paymentMethod === "cash") {
      console.log(`💵 Cash: awaiting retailer confirmation`);
    }

    // Return success with wallet balances
    const nextStepsMap: Record<"mpesa" | "card" | "cash", string> = {
      mpesa: "STK prompt sent to customer phone (awaiting PIN entry)",
      card: "Redirect to payment gateway (3D Secure may apply)",
      cash: "Retailer will confirm cash receipt on delivery",
    };

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Payment processed successfully",
      data: {
        transactionId: result.transactionId,
        orderId,
        amount,
        paymentMethod,
        walletBalances: result.walletBalances,
        ledgerEntriesCreated: result.ledgerEntries,
        nextSteps: nextStepsMap[paymentMethod as "mpesa" | "card" | "cash"],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Confirm payment after M-Pesa/card gateway response
 * Called by M-Pesa callback or Stripe webhook
 */
export async function confirmPayment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { transactionId, orderId, status, gateway } = req.body;

    if (!transactionId || !status) {
      throw new AppError(400, "transactionId and status are required");
    }

    console.log(
      `✓ Payment confirmed via ${gateway}: ${transactionId} -> ${status}`
    );

    // In production, you would:
    // 1. Verify the callback signature
    // 2. Check the transaction status from the gateway
    // 3. Update order status based on confirmation
    // 4. Trigger settlement obligation creation

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Payment confirmed",
      data: {
        transactionId,
        status,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get payment status
 */
export async function getPaymentStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      throw new AppError(400, "orderId is required");
    }

    const history = await paymentService.getPaymentHistory(parseInt(orderId as string));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Payment history retrieved",
      data: {
        orderId,
        transactions: history,
        totalPaid: history.reduce((sum, e) => sum + parseFloat(e.amount), 0),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refund (creates reversal ledger entry)
 * NEVER deletes ledger entries, NEVER updates them
 * Instead, create new entries to reverse
 */
export async function refundPayment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const { orderId, reason } = req.body;

    if (!orderId || !reason) {
      throw new AppError(400, "orderId and reason are required");
    }

    // TODO: Implement refund logic
    // 1. Get original payment ledger entries
    // 2. Create reversing entries (same amount, opposite direction)
    // 3. Verify balance still matches
    // 4. Update order status to "refunded"

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Refund initiated",
      data: {
        orderId,
        status: "pending",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}