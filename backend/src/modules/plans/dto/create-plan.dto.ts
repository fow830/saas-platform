import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsBoolean, IsOptional, IsObject, Min, MinLength } from 'class-validator';
import { BillingPeriod } from '@prisma/client';

export class CreatePlanDto {
  @ApiProperty({ example: 'Premium' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Premium plan with advanced features', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 4990.00 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ enum: BillingPeriod, example: 'MONTHLY' })
  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @ApiProperty({ 
    example: { 
      maxRequests: 10000, 
      support: 'priority', 
      api: true,
      sso: false 
    },
    required: false 
  })
  @IsOptional()
  @IsObject()
  features?: any;

  @ApiProperty({ example: 5, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxServices?: number;

  @ApiProperty({ example: 10, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsers?: number;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 14, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialDays?: number;

  @ApiProperty({ example: 2, default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}


