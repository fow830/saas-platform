import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, amount: number, description?: string) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 days from now

    return this.prisma.invoice.create({
      data: {
        userId,
        amount,
        currency: 'RUB',
        description,
        dueDate,
        status: 'PENDING',
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED' | 'REFUNDED') {
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : null,
      },
    });
  }
}

