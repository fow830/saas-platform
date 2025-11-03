import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { YooKassaProvider } from './providers/yookassa.provider';
import { CloudPaymentsProvider } from './providers/cloudpayments.provider';
import { RobokassaProvider } from './providers/robokassa.provider';
import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private yooKassaProvider: YooKassaProvider,
    private cloudPaymentsProvider: CloudPaymentsProvider,
    private robokassaProvider: RobokassaProvider,
    private invoicesService: InvoicesService,
  ) {}

  async create(
    invoiceId: string,
    userId: string,
    paymentMethod: 'YOOKASSA' | 'CLOUDPAYMENTS' | 'ROBOKASSA',
    returnUrl?: string,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice || invoice.userId !== userId) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new Error('Invoice already paid');
    }

    let payment;
    let paymentUrl: string | undefined;

    if (paymentMethod === 'YOOKASSA') {
      const yooKassaPayment = await this.yooKassaProvider.createPayment(
        Number(invoice.amount),
        invoiceId,
        userId,
        invoice.description || `Invoice ${invoiceId}`,
        returnUrl || `${process.env.APP_URL}/payment/success`,
      );

      payment = await this.prisma.payment.create({
        data: {
          invoiceId,
          userId,
          amount: invoice.amount,
          currency: 'RUB',
          paymentMethod: 'YOOKASSA',
          status: 'PENDING',
          transactionId: yooKassaPayment.id,
          metadata: {
            yooKassaId: yooKassaPayment.id,
            status: yooKassaPayment.status,
          },
        },
      });

      paymentUrl = yooKassaPayment.confirmation?.confirmation_url;
    } else if (paymentMethod === 'CLOUDPAYMENTS') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const cloudPaymentsPayment = await this.cloudPaymentsProvider.createPayment(
        Number(invoice.amount),
        invoiceId,
        userId,
        invoice.description || `Invoice ${invoiceId}`,
        returnUrl || `${process.env.APP_URL}/payment/success`,
        user?.email,
      );

      payment = await this.prisma.payment.create({
        data: {
          invoiceId,
          userId,
          amount: invoice.amount,
          currency: 'RUB',
          paymentMethod: 'CLOUDPAYMENTS',
          status: 'PENDING',
          transactionId: cloudPaymentsPayment.Model?.TransactionId?.toString(),
          metadata: {
            transactionId: cloudPaymentsPayment.Model?.TransactionId,
            status: cloudPaymentsPayment.Model?.Status,
            model: cloudPaymentsPayment.Model,
          },
        },
      });

      // CloudPayments doesn't provide redirect URL in charge response
      // Payment should be processed via 3D-Secure redirect or widget
      paymentUrl = returnUrl || `${process.env.APP_URL}/payment/process/${payment.id}`;
    } else if (paymentMethod === 'ROBOKASSA') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const robokassaPayment = await this.robokassaProvider.createPayment(
        Number(invoice.amount),
        invoiceId,
        userId,
        invoice.description || `Invoice ${invoiceId}`,
        returnUrl || `${process.env.APP_URL}/payment/success`,
        user?.email,
      );

      payment = await this.prisma.payment.create({
        data: {
          invoiceId,
          userId,
          amount: invoice.amount,
          currency: 'RUB',
          paymentMethod: 'ROBOKASSA',
          status: 'PENDING',
          transactionId: robokassaPayment.invoiceId.toString(),
          metadata: {
            invId: robokassaPayment.invoiceId,
            originalInvoiceId: invoiceId,
          },
        },
      });

      paymentUrl = robokassaPayment.paymentUrl;
    } else {
      throw new Error(`Payment method ${paymentMethod} not supported`);
    }

    return {
      payment,
      paymentUrl,
    };
  }

  async handleYooKassaWebhook(data: any, signature?: string) {
    // Verify webhook signature if provided
    if (signature && !this.yooKassaProvider.verifyWebhook(data, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const paymentId = data.object?.id;
    const status = data.object?.status;
    const metadata = data.object?.metadata;

    if (!paymentId || !metadata?.invoiceId || !metadata?.userId) {
      throw new Error('Invalid webhook data');
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        transactionId: paymentId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    let paymentStatus: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' = 'PENDING';

    switch (status) {
      case 'pending':
        paymentStatus = 'PENDING';
        break;
      case 'waiting_for_capture':
        paymentStatus = 'PROCESSING';
        break;
      case 'succeeded':
        paymentStatus = 'SUCCEEDED';
        await this.invoicesService.updateStatus(metadata.invoiceId, 'PAID');
        break;
      case 'canceled':
        paymentStatus = 'FAILED';
        break;
      default:
        paymentStatus = 'PENDING';
    }

    await this.updateStatus(payment.id, paymentStatus, paymentId);

    return { success: true };
  }

  async handleCloudPaymentsWebhook(data: any, signature?: string) {
    // Verify webhook signature if provided
    if (signature && !this.cloudPaymentsProvider.verifyWebhook(data, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const webhookData = await this.cloudPaymentsProvider.handleWebhook(data);
    const payment = await this.prisma.payment.findFirst({
      where: {
        transactionId: webhookData.transactionId.toString(),
        paymentMethod: 'CLOUDPAYMENTS',
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const invoiceId = payment.invoiceId;
    if (webhookData.status === 'SUCCEEDED') {
      await this.invoicesService.updateStatus(invoiceId, 'PAID');
    }

    await this.updateStatus(payment.id, webhookData.status as any, webhookData.transactionId.toString());

    return { success: true };
  }

  async handleRobokassaWebhook(
    outSum: string,
    invId: string,
    signature: string,
    shpData?: Record<string, string>,
  ) {
    // Verify webhook signature
    if (!this.robokassaProvider.verifyWebhook(outSum, invId, signature, shpData)) {
      throw new Error('Invalid webhook signature');
    }

    const webhookData = await this.robokassaProvider.handleWebhook({
      OutSum: outSum,
      InvId: invId,
      SignatureValue: signature,
      ...shpData,
    });

    const payment = await this.prisma.payment.findFirst({
      where: {
        transactionId: invId,
        paymentMethod: 'ROBOKASSA',
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const invoiceId = payment.invoiceId;
    if (webhookData.status === 'SUCCEEDED') {
      await this.invoicesService.updateStatus(invoiceId, 'PAID');
    }

    await this.updateStatus(payment.id, webhookData.status as any, invId);

    return { success: true };
  }

  async findByUserId(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: {
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED', transactionId?: string) {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status,
        transactionId,
      },
    });
  }
}

