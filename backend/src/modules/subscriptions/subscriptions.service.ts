import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(userId: string, planId: string) {
    // Check if user already has an active subscription
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      throw new ConflictException('User already has an active subscription');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const now = new Date();
    const periodEnd = new Date(now);

    // Calculate period end based on billing period
    switch (plan.billingPeriod) {
      case 'MONTHLY':
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        break;
      case 'QUARTERLY':
        periodEnd.setMonth(periodEnd.getMonth() + 3);
        break;
      case 'YEARLY':
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        break;
      case 'LIFETIME':
        periodEnd.setFullYear(periodEnd.getFullYear() + 100);
        break;
    }

    const trialEnd = plan.trialDays > 0 ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000) : null;

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId,
        status: plan.trialDays > 0 ? 'TRIALING' : 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEnd,
      },
      include: {
        plan: {
          include: {
            planServices: {
              include: {
                service: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    // Create UserService entries for all services included in the plan
    if (subscription.plan.planServices && subscription.plan.planServices.length > 0) {
      await Promise.all(
        subscription.plan.planServices
          .filter((ps) => ps.included)
          .map((planService) =>
            this.prisma.userService.upsert({
              where: {
                userId_serviceId: {
                  userId,
                  serviceId: planService.serviceId,
                },
              },
              create: {
                userId,
                serviceId: planService.serviceId,
                accessLevel: 'basic',
              },
              update: {
                accessLevel: 'basic',
              },
            }),
          ),
      );
    }

    // Send email notification
    try {
      await this.emailService.sendSubscriptionCreatedEmail(
        subscription.user.email,
        subscription.plan.name,
      );
    } catch (error) {
      console.error('Failed to send subscription email:', error);
    }

    return subscription;
  }

  async findByUserId(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: {
        plan: {
          include: {
            planServices: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });
  }

  async cancel(userId: string) {
    return this.prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
      },
      include: {
        plan: true,
      },
    });
  }

  async changePlan(userId: string, newPlanId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: newPlanId },
      include: {
        planServices: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { userId },
      data: {
        planId: newPlanId,
      },
      include: {
        plan: {
          include: {
            planServices: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    // Update UserService entries for services included in the new plan
    if (plan.planServices && plan.planServices.length > 0) {
      await Promise.all(
        plan.planServices
          .filter((ps) => ps.included)
          .map((planService) =>
            this.prisma.userService.upsert({
              where: {
                userId_serviceId: {
                  userId,
                  serviceId: planService.serviceId,
                },
              },
              create: {
                userId,
                serviceId: planService.serviceId,
                accessLevel: 'basic',
              },
              update: {
                accessLevel: 'basic',
              },
            }),
          ),
      );
    }

    return updatedSubscription;
  }
}

