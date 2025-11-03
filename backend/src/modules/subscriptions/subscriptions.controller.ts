import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ChangePlanDto } from './dto/change-plan.dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user subscription' })
  async getMySubscription(@Request() req) {
    return this.subscriptionsService.findByUserId(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create subscription' })
  async create(@Request() req, @Body() createDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(req.user.id, createDto.planId);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancel(@Request() req) {
    return this.subscriptionsService.cancel(req.user.id);
  }

  @Put('change-plan')
  @ApiOperation({ summary: 'Change subscription plan' })
  async changePlan(@Request() req, @Body() changePlanDto: ChangePlanDto) {
    return this.subscriptionsService.changePlan(req.user.id, changePlanDto.planId);
  }
}

