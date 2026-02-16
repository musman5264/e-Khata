import * as WebBrowser from 'expo-web-browser';
import api from './api';

export interface PaymentRequest {
  party_id: number;
  amount: number;
  description?: string;
}

export interface PaymentResponse {
  payment_id: number;
  redirect_url?: string;
  status: string;
}

class EasyPaisaService {
  async collectPayment(data: PaymentRequest): Promise<PaymentResponse> {
    const res = await api.post('/payments/collect', {
      ...data,
      gateway: 'easypaisa',
    });
    
    const payment = res.data.data;
    
    if (payment.redirect_url) {
      await WebBrowser.openBrowserAsync(payment.redirect_url);
    }
    
    return payment;
  }

  async sendPayment(data: PaymentRequest): Promise<PaymentResponse> {
    const res = await api.post('/payments/send', {
      ...data,
      gateway: 'easypaisa',
    });
    return res.data.data;
  }
}

export const easypaisaService = new EasyPaisaService();
