import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

export interface RobokassaPayment {
  MerchantLogin: string;
  OutSum: number;
  InvId: number;
  Description: string;
  SignatureValue: string;
  Email?: string;
  Culture?: string;
  ReturnUrl?: string;
  SuccessURL?: string;
  FailURL?: string;
}

export interface RobokassaResponse {
  paymentUrl: string;
  invoiceId: number;
}

@Injectable()
export class RobokassaProvider {
  private merchantLogin: string;
  private password1: string; // Password #1 for signature generation
  private password2: string; // Password #2 for webhook verification
  private isTestMode: boolean;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.merchantLogin = this.configService.get<string>('ROBOKASSA_MERCHANT_LOGIN') || '';
    this.password1 = this.configService.get<string>('ROBOKASSA_PASSWORD_1') || '';
    this.password2 = this.configService.get<string>('ROBOKASSA_PASSWORD_2') || '';
    this.isTestMode = this.configService.get<string>('ROBOKASSA_TEST_MODE') === 'true';
    this.baseUrl = this.isTestMode
      ? 'https://auth.robokassa.ru/Merchant/Index.aspx'
      : 'https://auth.robokassa.ru/Merchant/Index.aspx';
  }

  async createPayment(
    amount: number,
    invoiceId: string,
    userId: string,
    description: string,
    returnUrl?: string,
    email?: string,
  ): Promise<RobokassaResponse> {
    // Use invoiceId as InvId (Robokassa requires numeric InvId)
    const invId = this.generateInvId(invoiceId);

    // Generate signature: MD5(MerchantLogin:OutSum:InvId:Password#1)
    const signatureString = `${this.merchantLogin}:${amount}:${invId}:${this.password1}`;
    const signature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();

    const params = new URLSearchParams({
      MerchantLogin: this.merchantLogin,
      OutSum: amount.toString(),
      InvId: invId.toString(),
      Description: description,
      SignatureValue: signature,
      Culture: 'ru',
    });

    if (email) {
      params.append('Email', email);
    }

    if (returnUrl) {
      params.append('SuccessURL', returnUrl);
      params.append('FailURL', returnUrl);
    }

    const paymentUrl = `${this.baseUrl}?${params.toString()}`;

    return {
      paymentUrl,
      invoiceId: invId,
    };
  }

  async getPaymentStatus(invId: number): Promise<any> {
    // Robokassa doesn't have a direct API for status checking
    // Status is typically checked via webhook or ResultURL
    throw new Error('Robokassa status check should be done via webhook');
  }

  verifyWebhook(
    outSum: string,
    invId: string,
    signature: string,
    shpData?: Record<string, string>,
  ): boolean {
    // Generate signature: MD5(OutSum:InvId:Password#2[:shp_Key1=Value1[:shp_Key2=Value2[...]]])
    let signatureString = `${outSum}:${invId}:${this.password2}`;

    if (shpData) {
      const sortedKeys = Object.keys(shpData)
        .filter((key) => key.startsWith('shp_'))
        .sort();
      const shpString = sortedKeys.map((key) => `${key}=${shpData[key]}`).join(':');
      if (shpString) {
        signatureString += `:${shpString}`;
      }
    }

    const calculatedSignature = crypto
      .createHash('md5')
      .update(signatureString)
      .digest('hex')
      .toUpperCase();

    return calculatedSignature === signature.toUpperCase();
  }

  async handleWebhook(data: any): Promise<{
    transactionId: number;
    status: string;
    amount: number;
    invoiceId: string;
  }> {
    const outSum = data.OutSum || data.out_sum;
    const invId = parseInt(data.InvId || data.inv_id || '0');
    const signature = data.SignatureValue || data.signature_value || '';

    return {
      transactionId: invId,
      status: 'SUCCEEDED', // If webhook is called, payment is successful
      amount: parseFloat(outSum || '0'),
      invoiceId: invId.toString(),
    };
  }

  private generateInvId(invoiceId: string): number {
    // Convert UUID string to numeric ID for Robokassa
    // Using simple hash to get consistent numeric ID
    const hash = crypto.createHash('md5').update(invoiceId).digest('hex');
    // Take first 8 characters and convert to number (max safe integer length)
    const numericId = parseInt(hash.substring(0, 8), 16) % 2147483647; // Max 32-bit integer
    return numericId;
  }

  // Helper method to extract invoice ID from Robokassa InvId
  getOriginalInvoiceId(invId: number): string {
    // In real implementation, you'd store mapping between InvId and invoiceId
    // For now, return as string
    return invId.toString();
  }
}

