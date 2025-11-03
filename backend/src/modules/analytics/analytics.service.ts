import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getUserStats(userId: string) {
    const [servicesCount, totalUsage, invoicesCount, totalSpent] = await Promise.all([
      this.prisma.userService.count({
        where: { userId },
      }),
      this.prisma.userService.aggregate({
        where: { userId },
        _sum: { usageCount: true },
      }),
      this.prisma.invoice.count({
        where: { userId },
      }),
      this.prisma.payment.aggregate({
        where: {
          userId,
          status: 'SUCCEEDED',
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      servicesCount,
      totalUsage: totalUsage._sum.usageCount || 0,
      invoicesCount,
      totalSpent: totalSpent._sum.amount || 0,
    };
  }

  async getServiceUsage(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.lastUsedAt = {};
      if (startDate) where.lastUsedAt.gte = startDate;
      if (endDate) where.lastUsedAt.lte = endDate;
    }

    return this.prisma.userService.findMany({
      where,
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
  }

  async getRevenueStats(userId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      status: 'SUCCEEDED',
    };

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalRevenue, paymentsCount, byMethod] = await Promise.all([
      this.prisma.payment.aggregate({
        where,
        _sum: { amount: true },
      }),
      this.prisma.payment.count({ where }),
      this.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      paymentsCount,
      byMethod: byMethod.map((item) => ({
        method: item.paymentMethod,
        total: item._sum.amount || 0,
        count: item._count.id,
      })),
    };
  }

  async getPlatformStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [usersCount, activeSubscriptions, servicesUsage] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.subscription.count({
        where: {
          ...where,
          status: 'ACTIVE',
        },
      }),
      this.prisma.userService.aggregate({
        where: startDate || endDate
          ? {
              lastUsedAt: startDate || endDate ? {} : undefined,
            }
          : {},
        _sum: { usageCount: true },
      }),
    ]);

    return {
      usersCount,
      activeSubscriptions,
      totalServicesUsage: servicesUsage._sum.usageCount || 0,
    };
  }
}

