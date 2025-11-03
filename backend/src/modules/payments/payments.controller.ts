import { Controller, Get, Post, Body, UseGuards, Request, Headers, HttpCode, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user payments' })
  async getMyPayments(@Request() req) {
    return this.paymentsService.findByUserId(req.user.id);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment' })
  async createPayment(@Request() req, @Body() createDto: CreatePaymentDto) {
    return this.paymentsService.create(
      createDto.invoiceId,
      req.user.id,
      createDto.paymentMethod,
      createDto.returnUrl,
    );
  }

  @Post('webhook/yookassa')
  @HttpCode(200)
  @ApiOperation({ summary: 'YooKassa webhook handler' })
  async yookassaWebhook(
    @Body() body: any,
    @Headers('x-signature') signature?: string,
  ) {
    return this.paymentsService.handleYooKassaWebhook(body, signature);
  }

  @Post('webhook/cloudpayments')
  @HttpCode(200)
  @ApiOperation({ summary: 'CloudPayments webhook handler' })
  async cloudpaymentsWebhook(
    @Body() body: any,
    @Headers('x-signature') signature?: string,
  ) {
    return this.paymentsService.handleCloudPaymentsWebhook(body, signature);
  }

  @Post('webhook/robokassa')
  @HttpCode(200)
  @ApiOperation({ summary: 'Robokassa webhook handler' })
  async robokassaWebhook(
    @Body() body: any,
    @Query('OutSum') outSum?: string,
    @Query('InvId') invId?: string,
    @Query('SignatureValue') signature?: string,
  ) {
    // Extract shp_ parameters
    const shpData: Record<string, string> = {};
    Object.keys(body).forEach((key) => {
      if (key.startsWith('shp_')) {
        shpData[key] = body[key];
      }
    });

    return this.paymentsService.handleRobokassaWebhook(
      outSum || body.OutSum || body.out_sum,
      invId || body.InvId || body.inv_id,
      signature || body.SignatureValue || body.signature_value,
      Object.keys(shpData).length > 0 ? shpData : undefined,
    );
  }
}

