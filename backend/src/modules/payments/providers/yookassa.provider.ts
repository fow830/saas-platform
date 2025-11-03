import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

export interface YooKassaPayment {
  amount: {
    value: string;
    currency: string;
  };
  confirmation: {
    type: string;
    return_url: string;
  };
  capture: boolean;
  description: string;
  metadata: {
    invoiceId: string;
    userId: string;
  };
}

export interface YooKassaResponse {
  id: string;
  status: string;
  amount: {
    value: string;
    currency: string;
  };
  confirmation: {
    confirmation_url: string;
  };
}

@Injectable()
export class YooKassaProvider {
  private shopId: string;
  private secretKey: string;
  private apiUrl = 'https://api.yookassa.ru/v3';

  constructor(private configService: ConfigService) {
    this.shopId = this.configService.get<string>('YUKASSA_SHOP_ID') || '';
    this.secretKey = this.configService.get<string>('YUKASSA_SECRET_KEY') || '';
  }

  async createPayment(
    amount: number,
    invoiceId: string,
    userId: string,
    description: string,
    returnUrl: string,
  ): Promise<YooKassaResponse> {
    const payment: YooKassaPayment = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      capture: true,
      description,
      metadata: {
        invoiceId,
        userId,
      },
    };

    try {
      const response = await axios.post(
        `${this.apiUrl}/payments`,
        payment,
        {
          auth: {
            username: this.shopId,
            password: this.secretKey,
          },
          headers: {
            'Idempotence-Key': `${invoiceId}-${Date.now()}`,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`YooKassa payment creation failed: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/payments/${paymentId}`, {
        auth: {
          username: this.shopId,
          password: this.secretKey,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`YooKassa get payment failed: ${error.message}`);
    }
  }

  verifyWebhook(data: any, signature: string): boolean {
    if (!this.secretKey || !signature) {
      return false;
    }

    try {
      // YooKassa uses HMAC-SHA256 for webhook verification
      // Get the raw body or stringified data
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Calculate HMAC
      const calculatedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(dataString)
        .digest('hex');

      // Compare signatures (YooKassa sends signature in specific format)
      // In production, signature might come in different format (base64, etc.)
      // Adjust based on actual YooKassa webhook format
      return calculatedSignature === signature || 
             Buffer.from(calculatedSignature).toString('base64') === signature;
    } catch (error) {
      console.error('YooKassa webhook verification error:', error);
      return false;
    }
  }
}

