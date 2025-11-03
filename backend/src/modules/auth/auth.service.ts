import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  private async generateSimpleId(): Promise<string> {
    // Find the maximum simpleId using raw query to handle ordering by numeric value
    try {
      const result = await this.prisma.$queryRaw<Array<{ simpleId: string }>>`
        SELECT "simpleId" 
        FROM "users" 
        WHERE "simpleId" IS NOT NULL 
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

  async register(registerDto: RegisterDto) {
    const { email, password, firstName } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate simple ID
    const simpleId = await this.generateSimpleId();

    // Create user
    const user = await this.prisma.user.create({
      data: {
        simpleId,
        email,
        passwordHash,
        firstName,
      },
      select: {
        id: true,
        simpleId: true,
        email: true,
        firstName: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.firstName || undefined);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Create session
    await this.createSession(user.id, tokens.accessToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid || user.status !== 'ACTIVE') {
      return null;
    }

    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        simpleId: true,
        email: true,
        firstName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
    };
  }

  private async createSession(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }
}

