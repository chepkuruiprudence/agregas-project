// backend/src/services/mpesa.service.ts

import axios from 'axios';
import { AppError } from '../middleware/errorHandler';

interface STKPushPayload {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: string;
  Amount: number;
  PartyA: string; // Customer phone (254712345678)
  PartyB: string; // Business shortcode
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string; // Order ID
  TransactionDesc: string;
  Remark: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface CallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number; // 0 = success, non-zero = failure
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

export class MpesaService {
  // Helper to dynamically match base URLs based on environment configuration at execution runtime
  private getBaseUrl(): string {
    return (process.env.MPESA_ENVIRONMENT || 'sandbox') === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';
  }

  /**
   * Helper method to generate an explicit East Africa Time (EAT) timestamp string (YYYYMMDDHHmmss)
   */
  private getEATTimestamp(): string {
    const now = new Date();
    const eatOffset = 3 * 60 * 60 * 1000; // Add 3 hours for East Africa Time
    const eatDate = new Date(now.getTime() + eatOffset);

    return eatDate.toISOString()
      .replace(/[^\d]/g, '')
      .slice(0, 14);
  }

  /**
   * STEP 2: Generate Password for STK Push dynamically reading current ENV variables
   */
  private generatePassword(timestamp: string): string {
    const shortCode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || '';
    
    if (!passkey) {
      console.error('❌ CRITICAL ERROR: MPESA_PASSKEY is not defined or loaded in environment variables!');
    }

    const data = `${shortCode}${passkey}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * STEP 1: Get OAuth Access Token
   */
  private async getAccessToken(): Promise<string> {
    try {
      const consumerKey = process.env.MPESA_CONSUMER_KEY || '';
      const consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
      const baseUrl = this.getBaseUrl();

      // 🔍 OAUTH DEBUGGER:
      console.log("================= OAUTH DEBUGGER =================");
      console.log(`Key Length: ${consumerKey.length}, Secret Length: ${consumerSecret.length}`);
      console.log(`Starts with quotes? Key: ${consumerKey.startsWith('"') || consumerKey.startsWith("'")}, Secret: ${consumerSecret.startsWith('"') || consumerSecret.startsWith("'")}`);
      console.log("==================================================");

      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

      const response = await axios.get(
        `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
          timeout: 10000,
        }
      );

      console.log('✓ M-Pesa access token obtained');
      return response.data.access_token;
    } catch (error: any) {
      console.error('❌ Failed to get M-Pesa access token:', error.message);
      // Log the exact response from Safaricom if available
      if (error.response?.data) {
        console.error('Safaricom OAuth Raw Error:', error.response.data);
      }
      throw new AppError(500, 'M-Pesa authentication failed');
    }
  }

  /**
   * STEP 3: Initiate STK Push
   */
  async initiateSTKPush(
    orderId: number,
    amount: number,
    phoneNumber: string
  ): Promise<STKPushResponse> {
    try {
      console.log(`💳 Initiating STK Push for order ${orderId}, amount ${amount}, phone ${phoneNumber}`);

      const shortCode = process.env.MPESA_SHORTCODE || '174379';
      const callbackUrl = process.env.MPESA_CALLBACK_URL || '';
      const baseUrl = this.getBaseUrl();

      // Validate phone number format
      let formattedPhone = phoneNumber.replace(/\D/g, ''); 
      if (formattedPhone.length === 9) {
        formattedPhone = '254' + formattedPhone; 
      } else if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      }

      if (!formattedPhone.startsWith('254')) {
        throw new AppError(400, 'Invalid phone number format');
      }

      console.log(`📱 Formatted phone: ${formattedPhone}`);

      const timestamp = this.getEATTimestamp();
      const password = this.generatePassword(timestamp);
      const accessToken = await this.getAccessToken();

      // Prepare STK Push payload
      const payload: STKPushPayload = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.floor(amount), 
        PartyA: formattedPhone,
        PartyB: shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: `ORDER-${orderId}`,
        TransactionDesc: `AGREGAS Order ${orderId}`,
        Remark: 'LPG Gas Payment',
      };

      console.log('📤 Sending STK Push request:', {
        BusinessShortCode: payload.BusinessShortCode,
        Amount: payload.Amount,
        PhoneNumber: payload.PhoneNumber,
        AccountReference: payload.AccountReference,
      });

      const response = await axios.post(
        `${baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('✓ STK Push initiated successfully');
      console.log('Response:', {
        MerchantRequestID: response.data.MerchantRequestID,
        CheckoutRequestID: response.data.CheckoutRequestID,
        ResponseCode: response.data.ResponseCode,
        CustomerMessage: response.data.CustomerMessage,
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ STK Push error:', error.response?.data || error.message);
      throw new AppError(
        500,
        error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment'
      );
    }
  }

  /**
   * STEP 4: Handle Callback from M-Pesa
   */
  parseCallback(callbackData: CallbackPayload): {
    success: boolean;
    merchantRequestId: string;
    checkoutRequestId: string;
    resultCode: number;
    resultDesc: string;
    amount?: number;
    mpesaReceiptNumber?: string;
    transactionDate?: string;
  } {
    try {
      const stkCallback = callbackData.Body.stkCallback;

      const result = {
        success: stkCallback.ResultCode === 0,
        merchantRequestId: stkCallback.MerchantRequestID,
        checkoutRequestId: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
      };

      if (result.success && stkCallback.CallbackMetadata) {
        const items = stkCallback.CallbackMetadata.Item;
        const amount = items.find((i) => i.Name === 'Amount')?.Value;
        const receiptNumber = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;
        const transactionDate = items.find((i) => i.Name === 'TransactionDate')?.Value;

        return {
          ...result,
          amount: typeof amount === 'number' ? amount : parseFloat(String(amount)),
          mpesaReceiptNumber: String(receiptNumber),
          transactionDate: String(transactionDate),
        };
      }

      return result;
    } catch (error: any) {
      console.error('Error parsing M-Pesa callback:', error);
      throw new AppError(400, 'Invalid M-Pesa callback format');
    }
  }

  /**
   * STEP 5: Query STK Status
   */
  async querySTKStatus(
    merchantRequestId: string,
    checkoutRequestId: string
  ): Promise<any> {
    try {
      const shortCode = process.env.MPESA_SHORTCODE || '174379';
      const baseUrl = this.getBaseUrl();
      const timestamp = this.getEATTimestamp();
      const password = this.generatePassword(timestamp);
      const accessToken = await this.getAccessToken();

      // Add these lines right before: const response = await axios.post(...)
      console.log("================= DARAJA DEBUGGER =================");
      console.log("Using ShortCode:", shortCode);
      console.log("Using Passkey:", process.env.MPESA_PASSKEY);
      console.log("Using Generated Timestamp:", timestamp);
      console.log("Generated Password String:", password);
      console.log("===================================================");

      const response = await axios.post(
        `${baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: shortCode,
          CheckoutRequestID: checkoutRequestId,
          Password: password,
          Timestamp: timestamp,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error querying STK status:', error.message);
      throw error;
    }
  }
}

export const mpesaService = new MpesaService();