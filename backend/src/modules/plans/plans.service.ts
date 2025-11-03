import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.plan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        planServices: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
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

    return plan;
  }

  async create(createPlanDto: CreatePlanDto) {
    // Check if plan with same name exists
    const existingPlan = await this.prisma.plan.findUnique({
      where: { name: createPlanDto.name },
    });

    if (existingPlan) {
      throw new ConflictException('Plan with this name already exists');
    }

    return this.prisma.plan.create({
      data: {
        name: createPlanDto.name,
        description: createPlanDto.description,
        price: createPlanDto.price,
        billingPeriod: createPlanDto.billingPeriod,
        features: createPlanDto.features || {},
        maxServices: createPlanDto.maxServices ?? 1,
        maxUsers: createPlanDto.maxUsers ?? 1,
        isActive: createPlanDto.isActive ?? true,
        trialDays: createPlanDto.trialDays ?? 0,
        sortOrder: createPlanDto.sortOrder ?? 0,
      },
      include: {
        planServices: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async update(id: string, updatePlanDto: UpdatePlanDto) {
    await this.findOne(id); // Check if plan exists

    // Check if name is being updated and if it conflicts
    if (updatePlanDto.name) {
      const existingPlan = await this.prisma.plan.findUnique({
        where: { name: updatePlanDto.name },
      });

      if (existingPlan && existingPlan.id !== id) {
        throw new ConflictException('Plan with this name already exists');
      }
    }

    return this.prisma.plan.update({
      where: { id },
      data: {
        ...updatePlanDto,
      },
      include: {
        planServices: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if plan exists

    // Check if plan has active subscriptions
    const activeSubscriptions = await this.prisma.subscription.count({
      where: {
        planId: id,
        status: {
          in: ['ACTIVE', 'TRIALING'],
        },
      },
    });

    if (activeSubscriptions > 0) {
      throw new ConflictException(
        `Cannot delete plan with ${activeSubscriptions} active subscription(s). Please deactivate it instead.`,
      );
    }

    return this.prisma.plan.delete({
      where: { id },
    });
  }
}

