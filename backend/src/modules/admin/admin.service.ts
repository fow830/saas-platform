import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [usersCount, subscriptionsCount, activeSubscriptions, totalRevenue] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      users: usersCount,
      subscriptions: subscriptionsCount,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }

  async getAllUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role: {
            not: 'ADMIN',
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          simpleId: true,
          email: true,
          firstName: true,
          balance: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({
        where: {
          role: {
            not: 'ADMIN',
          },
        },
      }),
    ]);

    // Debug: log first user to check simpleId
    if (users.length > 0) {
      console.log('getAllUsers - First user:', JSON.stringify(users[0], null, 2));
    }

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllAdmins(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [admins, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role: 'ADMIN',
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          simpleId: true,
          email: true,
          firstName: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({
        where: {
          role: 'ADMIN',
        },
      }),
    ]);

    return {
      data: admins,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async generateSimpleId(): Promise<string> {
    // Find the maximum numeric simpleId; ignore non-numeric values (UUIDs for admins)
    try {
      const result = await this.prisma.$queryRaw<Array<{ simpleId: string }>>`
        SELECT "simpleId"
        FROM "users"
        WHERE "simpleId" IS NOT NULL AND "simpleId" ~ '^[0-9]+$'
        ORDER BY CAST("simpleId" AS INTEGER) DESC
        LIMIT 1
      `;

      let nextNumber = 1;
      if (result && result.length > 0 && result[0].simpleId) {
        const maxNumber = parseInt(result[0].simpleId, 10);
        if (!isNaN(maxNumber)) {
          nextNumber = maxNumber + 1;
        }
      }

      // Format as 5 digits with leading zeros
      return nextNumber.toString().padStart(5, '0');
    } catch (error) {
      console.error('Error generating simpleId:', error);
      // Fallback: count users and use that as base
      const userCount = await this.prisma.user.count();
      return (userCount + 1).toString().padStart(5, '0');
    }
  }

  async createAdmin(createAdminDto: CreateAdminDto) {
    const { email, password, firstName } = createAdminDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // For admins we do NOT use 5-digit simpleId. Assign UUID to simpleId field.
    const simpleId = uuidv4();

    // Create admin user with UUID simpleId
    const admin = await this.prisma.user.create({
      data: {
        simpleId,
        email,
        passwordHash,
        firstName,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        simpleId: true,
        email: true,
        firstName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return admin;
  }

  async getAllSubscriptions(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
            },
          },
          plan: true,
        },
      }),
      this.prisma.subscription.count(),
    ]);

    return {
      data: subscriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Project not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot change status of admin projects');
    }

    if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
      throw new BadRequestException('Invalid status. Must be ACTIVE or SUSPENDED');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
          select: {
            id: true,
            simpleId: true,
            email: true,
            firstName: true,
            role: true,
            status: true,
            createdAt: true,
          },
    });
  }

  async updateUserInfo(userId: string, data: { email?: string; firstName?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Project not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot modify admin projects');
    }

    // Проверка уникальности email, если он меняется
    if (data.email && data.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        throw new ConflictException('Project with this email already exists');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.firstName !== undefined && { firstName: data.firstName }),
      },
      select: {
        id: true,
        simpleId: true,
        email: true,
        firstName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async updateUserPassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Project not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot change password of admin projects');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
          select: {
            id: true,
            simpleId: true,
            email: true,
            firstName: true,
            role: true,
            status: true,
            createdAt: true,
          },
    });
  }

  async generateTemporaryPassword(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Project not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot generate password for admin projects');
    }

    // Генерируем случайный пароль из 12 символов
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let temporaryPassword = '';
    for (let i = 0; i < 12; i++) {
      temporaryPassword += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Сохраняем новый пароль
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Возвращаем пароль в открытом виде для показа админу
    return {
      password: temporaryPassword,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
      },
    };
  }
}

