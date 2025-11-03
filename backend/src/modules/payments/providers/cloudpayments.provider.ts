import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

export interface CloudPaymentsPayment {
  Amount: number;
  Currency: string;
  InvoiceId: string;
  Description: string;
  AccountId: string;
  Email?: string;
  ReturnUrl?: string;
}

export interface CloudPaymentsResponse {
  Model: {
    TransactionId: number;
    Amount: number;
    Currency: string;
    CurrencyCode: number;
    InvoiceId: string;
    AccountId: string;
    Email: string | null;
    Description: string;
    JsonData: any;
    CreatedDate: string;
    PayoutDate: string | null;
    PayoutDateIso: string | null;
    PayoutAmount: number | null;
    CreatedDateIso: string;
    AuthDate: string | null;
    AuthDateIso: string | null;
    ConfirmDate: string | null;
    ConfirmDateIso: string | null;
    AuthCode: string | null;
    TestMode: boolean;
    Rrn: string | null;
    OriginalTransactionId: number | null;
    FallBackScenarioDeclinedTransactionId: number | null;
    IpAddress: string;
    IpCountry: string;
    IpCity: string;
    IpRegion: string;
    IpDistrict: string;
    IpLatitude: number;
    IpLongitude: number;
    CardFirstSix: string;
    CardLastFour: string;
    CardExpDate: string;
    CardType: string;
    CardProduct: string;
    CardCategory: string;
    EscrowAccumulationId: number | null;
    IssuerBankCountry: string;
    Issuer: string;
    CardTypeCode: number;
    Status: string;
    StatusCode: string;
    CultureName: string;
    Reason: string;
    ReasonCode: string;
    CardHolderMessage: string;
    Type: number;
    Refunded: boolean;
    Name: string | null;
    Token: string | null;
    GatewayName: string;
    ApplePay: boolean;
    AndroidPay: boolean;
    WalletType: string;
    TotalFee: number | null;
  };
  Success: boolean;
  Message: string | null;
}

@Injectable()
export class CloudPaymentsProvider {
  private publicId: string;
  private apiSecret: string;
  private apiUrl = 'https://api.cloudpayments.ru';

  constructor(private configService: ConfigService) {
    this.publicId = this.configService.get<string>('CLOUDPAYMENTS_PUBLIC_ID') || '';
    this.apiSecret = this.configService.get<string>('CLOUDPAYMENTS_API_SECRET') || '';
  }

  async createPayment(
    amount: number,
    invoiceId: string,
    userId: string,
    description: string,
    returnUrl: string,
    email?: string,
  ): Promise<CloudPaymentsResponse> {
    const payment: CloudPaymentsPayment = {
      Amount: amount,
      Currency: 'RUB',
      InvoiceId: invoiceId,
      Description: description,
      AccountId: userId,
      ReturnUrl: returnUrl,
    };

    if (email) {
      payment.Email = email;
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/payments/cards/charge`,
        payment,
        {
          auth: {
            username: this.publicId,
            password: this.apiSecret,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`CloudPayments payment creation failed: ${error.message}`);
    }
  }

  async getPaymentStatus(transactionId: number): Promise<CloudPaymentsResponse> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/payments/get`,
        {
          params: { TransactionId: transactionId },
          auth: {
            username: this.publicId,
            password: this.apiSecret,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`CloudPayments get payment failed: ${error.message}`);
    }
  }

  verifyWebhook(data: any, signature: string): boolean {
    if (!this.apiSecret) {
      return false;
    }

    // CloudPayments uses HMAC-SHA256 for webhook verification
    const calculatedSignature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(JSON.stringify(data))
      .digest('base64');

    return calculatedSignature === signature;
  }

  async handleWebhook(data: any): Promise<{
    transactionId: number;
    status: string;
    amount: number;
    invoiceId: string;
  }> {
    const model = data.Model || data;

    return {
      transactionId: model.TransactionId || model.Id,
      status: this.mapStatus(model.Status || model.StatusCode),
      amount: model.Amount,
      invoiceId: model.InvoiceId,
    };
  }

  private mapStatus(status: string): 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' {
    const statusUpper = status?.toUpperCase() || '';
    
    if (statusUpper === 'COMPLETED' || statusUpper === 'SUCCEEDED' || statusUpper === 'CONFIRMED') {
      return 'SUCCEEDED';
    }
    if (statusUpper === 'AUTHORIZED' || statusUpper === 'PROCESSING') {
      return 'PROCESSING';
    }
    if (statusUpper === 'DECLINED' || statusUpper === 'CANCELLED' || statusUpper === 'FAILED') {
      return 'FAILED';
    }
    
    return 'PENDING';
  }
}

