import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.service.findUnique({
      where: { slug },
    });
  }

  async getUserServices(userId: string) {
    return this.prisma.userService.findMany({
      where: { userId },
      include: {
        service: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async getUserService(userId: string, serviceId: string) {
    return this.prisma.userService.findUnique({
      where: {
        userId_serviceId: {
          userId,
          serviceId,
        },
      },
      include: {
        service: true,
      },
    });
  }

  async useService(userId: string, serviceId: string) {
    // Check if user has access to this service
    const userService = await this.prisma.userService.findUnique({
      where: {
        userId_serviceId: {
          userId,
          serviceId,
        },
      },
      include: {
        service: true,
      },
    });

    if (!userService) {
      throw new NotFoundException('Service not found or user does not have access');
    }

    // Check rate limit if exists
    const service = userService.service;
    if (service.rateLimitPerDay) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Check if user exceeded daily limit
      if (
        userService.lastUsedAt &&
        new Date(userService.lastUsedAt) >= todayStart &&
        userService.usageCount >= service.rateLimitPerDay
      ) {
        throw new ForbiddenException(
          `Daily usage limit (${service.rateLimitPerDay}) exceeded for this service`,
        );
      }

      // Reset count if it's a new day
      let usageCount = userService.usageCount;
      if (!userService.lastUsedAt || new Date(userService.lastUsedAt) < todayStart) {
        usageCount = 0;
      }

      // Check limit before incrementing
      if (usageCount >= service.rateLimitPerDay) {
        throw new ForbiddenException(
          `Daily usage limit (${service.rateLimitPerDay}) exceeded for this service`,
        );
      }
    }

    // Update usage
    return this.prisma.userService.update({
      where: {
        userId_serviceId: {
          userId,
          serviceId,
        },
      },
      data: {
        usageCount: {
          increment: 1,
        },
        lastUsedAt: new Date(),
      },
      include: {
        service: true,
      },
    });
  }

  async createUserService(userId: string, serviceId: string, accessLevel: string = 'basic') {
    // Check if service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Check if user service already exists
    const existing = await this.prisma.userService.findUnique({
      where: {
        userId_serviceId: {
          userId,
          serviceId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Create user service
    return this.prisma.userService.create({
      data: {
        userId,
        serviceId,
        accessLevel,
      },
      include: {
        service: true,
      },
    });
  }
}

