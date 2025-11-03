import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../database/prisma.service';
import { YooKassaProvider } from './providers/yookassa.provider';
import { CloudPaymentsProvider } from './providers/cloudpayments.provider';
import { RobokassaProvider } from './providers/robokassa.provider';
import { InvoicesService } from '../invoices/invoices.service';
import { NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService: PrismaService;
  let yooKassaProvider: YooKassaProvider;
  let cloudPaymentsProvider: CloudPaymentsProvider;
  let robokassaProvider: RobokassaProvider;
  let invoicesService: InvoicesService;

  const mockPrismaService = {
    invoice: {
      findUnique: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockYooKassaProvider = {
    createPayment: jest.fn(),
    verifyWebhook: jest.fn(),
  };

  const mockCloudPaymentsProvider = {
    createPayment: jest.fn(),
    verifyWebhook: jest.fn(),
    handleWebhook: jest.fn(),
  };

  const mockRobokassaProvider = {
    createPayment: jest.fn(),
    verifyWebhook: jest.fn(),
    handleWebhook: jest.fn(),
  };

  const mockInvoicesService = {
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: YooKassaProvider,
          useValue: mockYooKassaProvider,
        },
        {
          provide: CloudPaymentsProvider,
          useValue: mockCloudPaymentsProvider,
        },
        {
          provide: RobokassaProvider,
          useValue: mockRobokassaProvider,
        },
        {
          provide: InvoicesService,
          useValue: mockInvoicesService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    yooKassaProvider = module.get<YooKassaProvider>(YooKassaProvider);
    cloudPaymentsProvider = module.get<CloudPaymentsProvider>(CloudPaymentsProvider);
    robokassaProvider = module.get<RobokassaProvider>(RobokassaProvider);
    invoicesService = module.get<InvoicesService>(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const invoiceId = 'inv-123';
    const userId = 'user-123';
    const mockInvoice = {
      id: invoiceId,
      userId,
      amount: 1000,
      currency: 'RUB',
      status: 'PENDING',
      description: 'Test invoice',
    };

    it('should create YooKassa payment', async () => {
      const mockPayment = {
        id: 'pay-123',
        invoiceId,
        userId,
        amount: 1000,
        currency: 'RUB',
        paymentMethod: 'YOOKASSA',
        status: 'PENDING',
        transactionId: 'yk-123',
      };

      const mockYooKassaResponse = {
        id: 'yk-123',
        status: 'pending',
        confirmation: {
          confirmation_url: 'https://yookassa.ru/payment/yk-123',
        },
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockYooKassaProvider.createPayment.mockResolvedValue(mockYooKassaResponse);
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);

      const result = await service.create(invoiceId, userId, 'YOOKASSA');

      expect(result.paymentUrl).toBe(mockYooKassaResponse.confirmation.confirmation_url);
      expect(mockYooKassaProvider.createPayment).toHaveBeenCalled();
      expect(mockPrismaService.payment.create).toHaveBeenCalled();
    });

    it('should create CloudPayments payment', async () => {
      const mockPayment = {
        id: 'pay-123',
        invoiceId,
        userId,
        amount: 1000,
        currency: 'RUB',
        paymentMethod: 'CLOUDPAYMENTS',
        status: 'PENDING',
        transactionId: '123456',
      };

      const mockCloudPaymentsResponse = {
        Success: true,
        Model: {
          TransactionId: 123456,
          Amount: 1000,
          Status: 'Authorized',
        },
      };

      const mockUser = {
        id: userId,
        email: 'test@example.com',
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockCloudPaymentsProvider.createPayment.mockResolvedValue(mockCloudPaymentsResponse);
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);

      const result = await service.create(invoiceId, userId, 'CLOUDPAYMENTS');

      expect(mockCloudPaymentsProvider.createPayment).toHaveBeenCalled();
      expect(result.payment).toBeDefined();
    });

    it('should create Robokassa payment', async () => {
      const mockPayment = {
        id: 'pay-123',
        invoiceId,
        userId,
        amount: 1000,
        currency: 'RUB',
        paymentMethod: 'ROBOKASSA',
        status: 'PENDING',
        transactionId: '12345',
      };

      const mockRobokassaResponse = {
        paymentUrl: 'https://auth.robokassa.ru/Merchant/Index.aspx?params',
        invoiceId: 12345,
      };

      const mockUser = {
        id: userId,
        email: 'test@example.com',
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockRobokassaProvider.createPayment.mockResolvedValue(mockRobokassaResponse);
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);

      const result = await service.create(invoiceId, userId, 'ROBOKASSA');

      expect(result.paymentUrl).toBe(mockRobokassaResponse.paymentUrl);
      expect(mockRobokassaProvider.createPayment).toHaveBeenCalled();
    });

    it('should throw NotFoundException if invoice does not exist', async () => {
      mockPrismaService.invoice.findUnique.mockResolvedValue(null);

      await expect(
        service.create(invoiceId, userId, 'YOOKASSA'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if invoice already paid', async () => {
      const paidInvoice = {
        ...mockInvoice,
        status: 'PAID',
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(paidInvoice);

      await expect(
        service.create(invoiceId, userId, 'YOOKASSA'),
      ).rejects.toThrow('Invoice already paid');
    });
  });

  describe('handleYooKassaWebhook', () => {
    it('should process successful payment', async () => {
      const paymentId = 'yk-123';
      const invoiceId = 'inv-123';
      const userId = 'user-123';

      const webhookData = {
        object: {
          id: paymentId,
          status: 'succeeded',
          metadata: {
            invoiceId,
            userId,
          },
        },
      };

      const mockPayment = {
        id: 'pay-123',
        invoiceId,
        userId,
        transactionId: paymentId,
      };

      mockYooKassaProvider.verifyWebhook.mockReturnValue(true);
      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'SUCCEEDED',
      });
      mockInvoicesService.updateStatus.mockResolvedValue({});

      const result = await service.handleYooKassaWebhook(webhookData);

      expect(result.success).toBe(true);
      expect(mockInvoicesService.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        'PAID',
      );
    });

    it('should throw error if signature invalid', async () => {
      const webhookData = { object: { id: 'yk-123' } };

      mockYooKassaProvider.verifyWebhook.mockReturnValue(false);

      await expect(
        service.handleYooKassaWebhook(webhookData, 'invalid-signature'),
      ).rejects.toThrow('Invalid webhook signature');
    });
  });

  describe('handleCloudPaymentsWebhook', () => {
    it('should process successful payment', async () => {
      const transactionId = 123456;
      const invoiceId = 'inv-123';

      const webhookData = {
        Model: {
          TransactionId: transactionId,
          Amount: 1000,
          Status: 'Completed',
        },
      };

      const mockPayment = {
        id: 'pay-123',
        invoiceId,
        transactionId: transactionId.toString(),
        paymentMethod: 'CLOUDPAYMENTS',
      };

      mockCloudPaymentsProvider.verifyWebhook.mockReturnValue(true);
      mockCloudPaymentsProvider.handleWebhook.mockResolvedValue({
        transactionId,
        status: 'SUCCEEDED',
        amount: 1000,
        invoiceId,
      });
      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'SUCCEEDED',
      });
      mockInvoicesService.updateStatus.mockResolvedValue({});

      const result = await service.handleCloudPaymentsWebhook(webhookData);

      expect(result.success).toBe(true);
      expect(mockInvoicesService.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        'PAID',
      );
    });
  });

  describe('handleRobokassaWebhook', () => {
    it('should process successful payment', async () => {
      const invId = '12345';
      const outSum = '1000';
      const signature = 'valid-signature';
      const invoiceId = 'inv-123';

      const mockPayment = {
        id: 'pay-123',
        invoiceId,
        transactionId: invId,
        paymentMethod: 'ROBOKASSA',
      };

      mockRobokassaProvider.verifyWebhook.mockReturnValue(true);
      mockRobokassaProvider.handleWebhook.mockResolvedValue({
        transactionId: parseInt(invId),
        status: 'SUCCEEDED',
        amount: 1000,
        invoiceId,
      });
      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'SUCCEEDED',
      });
      mockInvoicesService.updateStatus.mockResolvedValue({});

      const result = await service.handleRobokassaWebhook(
        outSum,
        invId,
        signature,
      );

      expect(result.success).toBe(true);
      expect(mockInvoicesService.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        'PAID',
      );
    });
  });
});

