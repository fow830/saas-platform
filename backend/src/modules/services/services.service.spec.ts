import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ServicesService', () => {
  let service: ServicesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    service: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userService: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserServices', () => {
    it('should return user services', async () => {
      const userId = 'user-123';
      const mockServices = [
        {
          id: 'us-1',
          userId,
          serviceId: 'svc-1',
          accessLevel: 'basic',
          usageCount: 5,
          lastUsedAt: new Date(),
          service: { id: 'svc-1', name: 'Service 1' },
        },
      ];

      mockPrismaService.userService.findMany.mockResolvedValue(mockServices);

      const result = await service.getUserServices(userId);

      expect(result).toEqual(mockServices);
      expect(mockPrismaService.userService.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { service: true },
        orderBy: { lastUsedAt: 'desc' },
      });
    });
  });

  describe('useService', () => {
    const userId = 'user-123';
    const serviceId = 'svc-1';

    it('should throw NotFoundException if user service does not exist', async () => {
      mockPrismaService.userService.findUnique.mockResolvedValue(null);

      await expect(service.useService(userId, serviceId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should increment usage count successfully', async () => {
      const mockUserService = {
        id: 'us-1',
        userId,
        serviceId,
        usageCount: 5,
        lastUsedAt: new Date('2024-01-01'),
        service: {
          id: serviceId,
          name: 'Service 1',
          rateLimitPerDay: null,
        },
      };

      const updatedService = {
        ...mockUserService,
        usageCount: 6,
        lastUsedAt: new Date(),
      };

      mockPrismaService.userService.findUnique.mockResolvedValue(mockUserService);
      mockPrismaService.userService.update.mockResolvedValue(updatedService);

      const result = await service.useService(userId, serviceId);

      expect(result.usageCount).toBe(6);
      expect(mockPrismaService.userService.update).toHaveBeenCalledWith({
        where: {
          userId_serviceId: { userId, serviceId },
        },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: expect.any(Date),
        },
        include: { service: true },
      });
    });

    it('should throw ForbiddenException when daily limit exceeded', async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const mockUserService = {
        id: 'us-1',
        userId,
        serviceId,
        usageCount: 10,
        lastUsedAt: today,
        service: {
          id: serviceId,
          name: 'Service 1',
          rateLimitPerDay: 10,
        },
      };

      mockPrismaService.userService.findUnique.mockResolvedValue(mockUserService);

      await expect(service.useService(userId, serviceId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reset usage count for new day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockUserService = {
        id: 'us-1',
        userId,
        serviceId,
        usageCount: 10,
        lastUsedAt: yesterday,
        service: {
          id: serviceId,
          name: 'Service 1',
          rateLimitPerDay: 10,
        },
      };

      const updatedService = {
        ...mockUserService,
        usageCount: 1,
        lastUsedAt: new Date(),
      };

      mockPrismaService.userService.findUnique.mockResolvedValue(mockUserService);
      mockPrismaService.userService.update.mockResolvedValue(updatedService);

      const result = await service.useService(userId, serviceId);

      expect(result.usageCount).toBe(1);
    });
  });

  describe('createUserService', () => {
    it('should create new user service', async () => {
      const userId = 'user-123';
      const serviceId = 'svc-1';
      const accessLevel = 'basic';

      const mockService = {
        id: serviceId,
        name: 'Service 1',
      };

      const mockUserService = {
        id: 'us-1',
        userId,
        serviceId,
        accessLevel,
        service: mockService,
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.userService.findUnique.mockResolvedValue(null);
      mockPrismaService.userService.create.mockResolvedValue(mockUserService);

      const result = await service.createUserService(userId, serviceId, accessLevel);

      expect(result).toEqual(mockUserService);
      expect(mockPrismaService.userService.create).toHaveBeenCalledWith({
        data: {
          userId,
          serviceId,
          accessLevel,
        },
        include: { service: true },
      });
    });

    it('should return existing user service if already exists', async () => {
      const userId = 'user-123';
      const serviceId = 'svc-1';
      const existingService = {
        id: 'us-1',
        userId,
        serviceId,
        accessLevel: 'basic',
      };

      mockPrismaService.service.findUnique.mockResolvedValue({ id: serviceId });
      mockPrismaService.userService.findUnique.mockResolvedValue(existingService);

      const result = await service.createUserService(userId, serviceId);

      expect(result).toEqual(existingService);
      expect(mockPrismaService.userService.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if service does not exist', async () => {
      const userId = 'user-123';
      const serviceId = 'svc-1';

      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(
        service.createUserService(userId, serviceId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

