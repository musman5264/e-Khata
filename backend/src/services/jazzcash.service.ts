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

export class JazzCashService {
  private static readonly BASE_URL = 'https://payments.jazzcash.com.pk';

  static generateHash(data: string): string {
    const integritySalt = config.paymentGateways.jazzcash.integritySalt || '';
    return crypto
      .createHmac('sha256', integritySalt)
      .update(data)
      .digest('hex');
  }

  static async initiatePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const merchantId = config.paymentGateways.jazzcash.merchantId;
      const password = config.paymentGateways.jazzcash.password;

      if (!merchantId || !password) {
        logger.error('JazzCash configuration missing');
        return {
          success: false,
          message: 'Payment gateway not configured'
        };
      }

      const timestamp = new Date().getTime();
      const txnRefNo = `T${timestamp}`;

      // Prepare data for hash
      const hashData = [
        merchantId,
        password,
        paymentRequest.orderId,
        paymentRequest.amount,
        paymentRequest.customerPhone,
        timestamp
      ].join('&');

      const secureHash = this.generateHash(hashData);

      // Prepare request payload
      const payload = {
        pp_Version: '1.1',
        pp_TxnType: 'MWALLET',
        pp_Language: 'EN',
        pp_MerchantID: merchantId,
        pp_Password: password,
        pp_TxnRefNo: txnRefNo,
        pp_Amount: (paymentRequest.amount * 100).toString(), // Convert to paisa
        pp_TxnCurrency: 'PKR',
        pp_TxnDateTime: timestamp.toString(),
        pp_BillReference: paymentRequest.orderId,
        pp_Description: paymentRequest.description,
        pp_MobileNumber: paymentRequest.customerPhone,
        pp_ReturnURL: paymentRequest.callbackUrl,
        pp_SecureHash: secureHash
      };

      // Make API call
      const response = await axios.post(
        `${this.BASE_URL}/CustomerPortal/transactionmanagement/merchantform`,
        payload,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      logger.info('JazzCash payment initiated:', response.data);

      return {
        success: true,
        transactionId: txnRefNo,
        paymentUrl: response.data.paymentUrl || `${this.BASE_URL}/ApplicationAPI/API/Payment/DoTransaction`
      };
    } catch (error: any) {
      logger.error('JazzCash payment error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Payment initiation failed'
      };
    }
  }

  static async verifyPayment(transactionId: string): Promise<{ success: boolean; status?: string }> {
    try {
      const merchantId = config.paymentGateways.jazzcash.merchantId;
      const password = config.paymentGateways.jazzcash.password;

      if (!merchantId || !password) {
        return { success: false };
      }

      // In production, you would make an API call to verify the transaction
      // For now, this is a placeholder
      logger.info(`Verifying JazzCash transaction: ${transactionId}`);

      return {
        success: true,
        status: 'pending'
      };
    } catch (error) {
      logger.error('JazzCash verification error:', error);
      return { success: false };
    }
  }
}
