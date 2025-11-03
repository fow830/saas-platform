import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../database/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    userService: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    invoice: {
      count: jest.fn(),
    },
    payment: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    subscription: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const userId = 'user-123';
      const mockStats = {
        servicesCount: 3,
        totalUsage: 100,
        invoicesCount: 5,
        totalSpent: 1500,
      };

      mockPrismaService.userService.count.mockResolvedValue(mockStats.servicesCount);
      mockPrismaService.userService.aggregate.mockResolvedValue({
        _sum: { usageCount: mockStats.totalUsage },
      });
      mockPrismaService.invoice.count.mockResolvedValue(mockStats.invoicesCount);
      mockPrismaService.payment.aggregate.mockResolvedValue({
        _sum: { amount: mockStats.totalSpent },
      });

      const result = await service.getUserStats(userId);

      expect(result).toEqual(mockStats);
      expect(mockPrismaService.userService.count).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should handle zero values correctly', async () => {
      const userId = 'user-123';

      mockPrismaService.userService.count.mockResolvedValue(0);
      mockPrismaService.userService.aggregate.mockResolvedValue({
        _sum: { usageCount: null },
      });
      mockPrismaService.invoice.count.mockResolvedValue(0);
      mockPrismaService.payment.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.getUserStats(userId);

      expect(result.totalUsage).toBe(0);
      expect(result.totalSpent).toBe(0);
    });
  });

  describe('getServiceUsage', () => {
    it('should return service usage without date filters', async () => {
      const userId = 'user-123';
      const mockUsage = [
        {
          id: 'us-1',
          userId,
          serviceId: 'svc-1',
          usageCount: 10,
          lastUsedAt: new Date(),
          service: { id: 'svc-1', name: 'Service 1', slug: 'service-1' },
        },
      ];

      mockPrismaService.userService.findMany.mockResolvedValue(mockUsage);

      const result = await service.getServiceUsage(userId);

      expect(result).toEqual(mockUsage);
      expect(mockPrismaService.userService.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { usageCount: 'desc' },
      });
    });

    it('should return service usage with date filters', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockUsage = [];

      mockPrismaService.userService.findMany.mockResolvedValue(mockUsage);

      const result = await service.getServiceUsage(userId, startDate, endDate);

      expect(result).toEqual(mockUsage);
      expect(mockPrismaService.userService.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
            lastUsedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
      );
    });
  });

  describe('getRevenueStats', () => {
    it('should return revenue statistics', async () => {
      const mockRevenue = {
        totalRevenue: 10000,
        paymentsCount: 50,
        byMethod: [
          { method: 'YOOKASSA', total: 6000, count: 30 },
          { method: 'CLOUDPAYMENTS', total: 4000, count: 20 },
        ],
      };

      mockPrismaService.payment.aggregate.mockResolvedValue({
        _sum: { amount: mockRevenue.totalRevenue },
      });
      mockPrismaService.payment.count.mockResolvedValue(mockRevenue.paymentsCount);
      mockPrismaService.payment.groupBy.mockResolvedValue([
        {
          paymentMethod: 'YOOKASSA',
          _sum: { amount: 6000 },
          _count: { id: 30 },
        },
        {
          paymentMethod: 'CLOUDPAYMENTS',
          _sum: { amount: 4000 },
          _count: { id: 20 },
        },
      ]);

      const result = await service.getRevenueStats();

      expect(result.totalRevenue).toBe(mockRevenue.totalRevenue);
      expect(result.paymentsCount).toBe(mockRevenue.paymentsCount);
      expect(result.byMethod).toHaveLength(2);
    });
  });

  describe('getPlatformStats', () => {
    it('should return platform statistics', async () => {
      const mockStats = {
        usersCount: 100,
        activeSubscriptions: 50,
        totalServicesUsage: 1000,
      };

      mockPrismaService.user.count.mockResolvedValue(mockStats.usersCount);
      mockPrismaService.subscription.count.mockResolvedValue(
        mockStats.activeSubscriptions,
      );
      mockPrismaService.userService.aggregate.mockResolvedValue({
        _sum: { usageCount: mockStats.totalServicesUsage },
      });

      const result = await service.getPlatformStats();

      expect(result).toEqual(mockStats);
    });
  });
});

