import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prismaService: PrismaService;
  let emailService: EmailService;

  const mockPrismaService = {
    subscription: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
    },
    userService: {
      upsert: jest.fn(),
    },
  };

  const mockEmailService = {
    sendSubscriptionCreatedEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-123';
    const planId = 'plan-123';

    it('should create subscription and UserService entries', async () => {
      const mockPlan = {
        id: planId,
        name: 'Basic Plan',
        billingPeriod: 'MONTHLY',
        trialDays: 0,
        planServices: [
          {
            id: 'ps-1',
            planId,
            serviceId: 'svc-1',
            included: true,
            service: { id: 'svc-1', name: 'Service 1' },
          },
          {
            id: 'ps-2',
            planId,
            serviceId: 'svc-2',
            included: true,
            service: { id: 'svc-2', name: 'Service 2' },
          },
        ],
      };

      const mockSubscription = {
        id: 'sub-123',
        userId,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        plan: mockPlan,
        user: {
          id: userId,
          email: 'test@example.com',
        },
      };

      mockPrismaService.subscription.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrismaService.subscription.create.mockResolvedValue(mockSubscription);
      mockPrismaService.userService.upsert.mockResolvedValue({});
      mockEmailService.sendSubscriptionCreatedEmail.mockResolvedValue(undefined);

      const result = await service.create(userId, planId);

      expect(result).toEqual(mockSubscription);
      expect(mockPrismaService.userService.upsert).toHaveBeenCalledTimes(2);
      expect(mockEmailService.sendSubscriptionCreatedEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Basic Plan',
      );
    });

    it('should throw ConflictException if user already has active subscription', async () => {
      const existingSubscription = {
        id: 'sub-123',
        userId,
        status: 'ACTIVE',
      };

      mockPrismaService.subscription.findUnique.mockResolvedValue(
        existingSubscription,
      );

      await expect(service.create(userId, planId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if plan does not exist', async () => {
      mockPrismaService.subscription.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.findUnique.mockResolvedValue(null);

      await expect(service.create(userId, planId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create subscription with trial status if plan has trial days', async () => {
      const mockPlan = {
        id: planId,
        name: 'Trial Plan',
        billingPeriod: 'MONTHLY',
        trialDays: 14,
        planServices: [],
      };

      const mockSubscription = {
        id: 'sub-123',
        userId,
        planId,
        status: 'TRIALING',
        trialEnd: new Date(),
        plan: mockPlan,
        user: { id: userId, email: 'test@example.com' },
      };

      mockPrismaService.subscription.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrismaService.subscription.create.mockResolvedValue(mockSubscription);
      mockEmailService.sendSubscriptionCreatedEmail.mockResolvedValue(undefined);

      const result = await service.create(userId, planId);

      expect(result.status).toBe('TRIALING');
    });
  });

  describe('changePlan', () => {
    const userId = 'user-123';
    const newPlanId = 'plan-456';

    it('should change plan and update UserService entries', async () => {
      const existingSubscription = {
        id: 'sub-123',
        userId,
        planId: 'plan-123',
      };

      const newPlan = {
        id: newPlanId,
        name: 'Premium Plan',
        planServices: [
          {
            id: 'ps-3',
            planId: newPlanId,
            serviceId: 'svc-3',
            included: true,
            service: { id: 'svc-3', name: 'Service 3' },
          },
        ],
      };

      const updatedSubscription = {
        ...existingSubscription,
        planId: newPlanId,
        plan: newPlan,
      };

      mockPrismaService.subscription.findUnique.mockResolvedValue(
        existingSubscription,
      );
      mockPrismaService.plan.findUnique.mockResolvedValue(newPlan);
      mockPrismaService.subscription.update.mockResolvedValue(updatedSubscription);
      mockPrismaService.userService.upsert.mockResolvedValue({});

      const result = await service.changePlan(userId, newPlanId);

      expect(result.planId).toBe(newPlanId);
      expect(mockPrismaService.userService.upsert).toHaveBeenCalled();
    });

    it('should throw NotFoundException if subscription does not exist', async () => {
      mockPrismaService.subscription.findUnique.mockResolvedValue(null);

      await expect(service.changePlan(userId, newPlanId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if plan does not exist', async () => {
      mockPrismaService.subscription.findUnique.mockResolvedValue({
        id: 'sub-123',
      });
      mockPrismaService.plan.findUnique.mockResolvedValue(null);

      await expect(service.changePlan(userId, newPlanId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel subscription', async () => {
      const userId = 'user-123';
      const subscription = {
        id: 'sub-123',
        userId,
        cancelAtPeriodEnd: true,
        plan: { id: 'plan-123', name: 'Basic Plan' },
      };

      mockPrismaService.subscription.update.mockResolvedValue(subscription);

      const result = await service.cancel(userId);

      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
        where: { userId },
        data: { cancelAtPeriodEnd: true },
        include: { plan: true },
      });
    });
  });
});

