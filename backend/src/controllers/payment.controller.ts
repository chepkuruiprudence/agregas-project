// backend/src/controllers/payment.controller.ts

import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment.service";
import { mpesaService } from "../services/mpesa.service"; // 🆕 Integrated
import { AppError } from "../middleware/errorHandler";

/**
 * OPTIONAL: Initiate payment acknowledgment
 */
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

    const validMethods = ["mpesa", "card", "cash"];
    if (!validMethods.includes(paymentMethod)) {
      throw new AppError(400, "Invalid payment method");
    }

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

    // Idempotency: stable per-order-per-attempt key.
    // NOTE: the frontend sends `order-${orderId}-${Date.now()}`; a unique key per
    // attempt is what we want so retries are not rejected as duplicates. True
    // dedup happens against existing ledger entries + STK initiation state.
    const idempotencyKey =
      req.headers["idempotency-key"] || `tx-${orderId}-${Date.now()}`;

    console.log(
      `实用 Processing ${paymentMethod} payment for order ${orderId}, amount ${amount} KES`
    );

    // M-PESA: skip eager processing entirely. The STK push branch below
    // initiates the push and tracks it; ledger + confirmation only happen
    // when Safaricom's callback confirms the payment.
    if (paymentMethod === "mpesa") {
      if (!phoneNumber) {
        throw new AppError(400, "phoneNumber is required for M-Pesa payments");
      }

      // Guard: don't start a new STK push for an already-paid order.
      const orderState = await paymentService.getOrderPaymentState(orderId);
      if (orderState.orderStatus !== "pending") {
        throw new AppError(400, `Order is ${orderState.orderStatus}, cannot pay`);
      }

      try {
        console.log(`📱 Initiating STK Push to ${phoneNumber}`);

        // Call M-Pesa service
        const stkResponse = await mpesaService.initiateSTKPush(
          orderId,
          amount,
          phoneNumber
        );

        // Track the initiation so Safaricom's callback can be correlated.
        // No ledger entries, no order status change at this point.
        await paymentService.initiateMpesaPayment({
          orderId,
          amount,
          phoneNumber,
          merchantRequestId: stkResponse.MerchantRequestID,
          checkoutRequestId: stkResponse.CheckoutRequestID,
        });

        console.log(`✓ STK Push sent, awaiting customer PIN entry`);

        return res.status(200).json({
          success: true,
          statusCode: 200,
          message: "M-Pesa payment initiated",
          data: {
            orderId,
            amount,
            paymentMethod: "mpesa",
            status: "awaiting_pin",
            mpesaDetails: {
              merchantRequestId: stkResponse.MerchantRequestID,
              checkoutRequestId: stkResponse.CheckoutRequestID,
              customerMessage: stkResponse.CustomerMessage,
            },
            nextSteps:
              "STK prompt sent to customer phone. Ledger and confirmation happen when the M-Pesa callback arrives.",
          },
          timestamp: new Date().toISOString(),
        });
      } catch (mpesaError: any) {
        console.error("❌ M-Pesa STK Push failed:", mpesaError.message);
        // Nothing was written to the ledger, so there is nothing to roll back.
        // Order stays "pending" and the customer can retry.
        throw new AppError(
          500,
          mpesaError.message || "Failed to send M-Pesa STK prompt"
        );
      }
    }

    // CARD / CASH: process eagerly (unchanged behavior)
    // Call payment service (handles ledger, wallets, etc)
    const paymentResult = await paymentService.processPayment({
      orderId,
      customerId: req.user.userId,
      amount,
      paymentMethod: paymentMethod as "mpesa" | "card" | "cash",
      idempotencyKey: String(idempotencyKey),
    });

    // If it's a duplicate, return cached result
    if (paymentResult.isDuplicate) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Payment already processed (idempotent)",
        data: paymentResult,
        timestamp: new Date().toISOString(),
      });
    }

    // STEP 3: Card payment
    if (paymentMethod === "card") {
      console.log(`💳 Card payment: would redirect to payment gateway`);
      // TODO: Integrate Stripe, Flutterwave, etc.
    }

    // STEP 4: Cash on delivery
    if (paymentMethod === "cash") {
      console.log(`💵 Cash on delivery: awaiting retailer confirmation`);
    }

    // Fallback response for Card or Cash payments
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
        transactionId: paymentResult.transactionId,
        orderId,
        amount,
        paymentMethod,
        walletBalances: paymentResult.walletBalances,
        ledgerEntriesCreated: paymentResult.ledgerEntries,
        nextSteps: nextStepsMap[paymentMethod as "mpesa" | "card" | "cash"],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * M-PESA CALLBACK ENDPOINT
 * Receives callback asynchronously from Safaricom after customer inputs PIN
 */
export async function handleMpesaCallback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("📥 M-Pesa callback received");
    console.log("Callback data:", JSON.stringify(req.body, null, 2));

    const callbackResult = mpesaService.parseCallback(req.body);
    console.log("Parsed callback:", callbackResult);

    if (callbackResult.success) {
      // SUCCESS: create ledger entries + confirm order (idempotent)
      const result = await paymentService.confirmMpesaPayment({
        checkoutRequestId: callbackResult.checkoutRequestId,
        mpesaReceiptNumber: callbackResult.mpesaReceiptNumber,
        callbackAmount: callbackResult.amount,
      });

      if (result.alreadyProcessed) {
        console.log(`ℹ️ Callback for order ${result.orderId} already processed (Safaricom retry)`);
        // Confirmation may have happened via STK query (no receipt); backfill it.
        await paymentService.backfillMpesaReceipt(
          callbackResult.checkoutRequestId,
          callbackResult.mpesaReceiptNumber
        );
      }
    } else {
      // FAILURE: wrong PIN, cancelled, timeout, insufficient balance, etc.
      const result = await paymentService.failMpesaPayment({
        checkoutRequestId: callbackResult.checkoutRequestId,
        resultCode: callbackResult.resultCode,
        resultDesc: callbackResult.resultDesc,
      });

      if (result.alreadyProcessed) {
        console.log(`ℹ️ Callback for order ${result.orderId} already processed (Safaricom retry)`);
      }
    }

    // Safaricom requires an explicit 200 OK acknowledgment to prevent retries
    res.status(200).json({
      success: true,
      message: "Callback received",
    });
  } catch (error: any) {
    // If confirmation failed transiently (DB hiccup), return non-200 so Safaricom
    // retries the callback. Malformed callbacks still get a 200 + logged error.
    console.error("Error handling M-Pesa callback:", error.message);
    if (error instanceof AppError && error.statusCode === 404) {
      // Unknown checkout request: nothing to correlate. Ack so Safaricom stops retrying.
      return res.status(200).json({ success: false, message: "Unknown checkout request" });
    }
    res.status(500).json({
      success: false,
      message: "Error processing callback",
    });
  }
}

/**
 * General gateway confirmation (e.g., fallback webhook manually fired or third-party webhooks)
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
 * Get payment status / history
 */
/**
 * GET /api/payments/verify/:orderId
 * ACTIVE verification: queries Safaricom for the outcome of the in-flight STK
 * push and applies success/failure immediately. The PaymentPage polls this
 * while awaiting the customer's PIN so confirmation does not depend solely on
 * the async callback or the reconciliation cycle.
 */
export async function verifyPayment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "User not authenticated");
    }

    const orderId = parseInt(req.params.orderId as string);
    if (isNaN(orderId)) {
      throw new AppError(400, "Invalid order ID");
    }

    const result = await paymentService.verifyOrderPayment(
      orderId,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Payment verification complete",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

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

    const history = await paymentService.getPaymentHistory(
      parseInt(orderId as string)
    );

    // Enrich with the live payment state (order status + latest STK attempt)
    // so the frontend can poll this endpoint while awaiting the PIN/callback.
    const paymentState = await paymentService.getOrderPaymentState(
      parseInt(orderId as string)
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Payment history retrieved",
      data: {
        ...paymentState,
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

    // TODO: Implement refund logic reversing existing transactions.

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