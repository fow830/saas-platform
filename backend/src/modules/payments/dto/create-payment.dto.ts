import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, Min, IsString, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ enum: ['YOOKASSA', 'CLOUDPAYMENTS', 'ROBOKASSA'] })
  @IsString()
  paymentMethod: 'YOOKASSA' | 'CLOUDPAYMENTS' | 'ROBOKASSA';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}

