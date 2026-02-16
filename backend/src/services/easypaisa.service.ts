import crypto from 'crypto';
import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

export interface PaymentRequest {
  amount: number;
  orderId: string;
  description: string;
  customerPhone: string;
  customerEmail?: string;
  callbackUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  message?: string;
}

export class EasypaisaService {
  private static readonly BASE_URL = 'https://easypay.easypaisa.com.pk/api';

  static generateHash(data: string): string {
    const hashKey = config.paymentGateways.easypaisa.hashKey || '';
    return crypto
      .createHmac('sha256', hashKey)
      .update(data)
      .digest('hex');
  }

  static async initiatePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const merchantId = config.paymentGateways.easypaisa.merchantId;
      const apiKey = config.paymentGateways.easypaisa.apiKey;

      if (!merchantId || !apiKey) {
        logger.error('Easypaisa configuration missing');
        return {
          success: false,
          message: 'Payment gateway not configured'
        };
      }

      // Prepare request payload
      const payload = {
        storeId: merchantId,
        orderId: paymentRequest.orderId,
        transactionAmount: paymentRequest.amount,
        mobileAccountNo: paymentRequest.customerPhone,
        emailAddress: paymentRequest.customerEmail,
        callbackUrl: paymentRequest.callbackUrl
      };

      // Generate signature
      const dataToHash = `${merchantId}${paymentRequest.orderId}${paymentRequest.amount}`;
      const signature = this.generateHash(dataToHash);

      // Make API call
      const response = await axios.post(
        `${this.BASE_URL}/payment/initiate`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-Signature': signature
          }
        }
      );

      logger.info('Easypaisa payment initiated:', response.data);

      return {
        success: true,
        transactionId: response.data.transactionId,
        paymentUrl: response.data.paymentUrl
      };
    } catch (error: any) {
      logger.error('Easypaisa payment error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Payment initiation failed'
      };
    }
  }

  static async verifyPayment(transactionId: string): Promise<{ success: boolean; status?: string }> {
    try {
      const merchantId = config.paymentGateways.easypaisa.merchantId;
      const apiKey = config.paymentGateways.easypaisa.apiKey;

      if (!merchantId || !apiKey) {
        return { success: false };
      }

      const response = await axios.get(
        `${this.BASE_URL}/payment/verify/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      return {
        success: true,
        status: response.data.status
      };
    } catch (error) {
      logger.error('Easypaisa verification error:', error);
      return { success: false };
    }
  }
}
