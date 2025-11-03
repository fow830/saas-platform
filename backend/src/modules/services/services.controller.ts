import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active services' })
  async findAll() {
    return this.servicesService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user services' })
  async getMyServices(@Request() req) {
    return this.servicesService.getUserServices(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by id' })
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Post(':id/use')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Use a service (increment usage count)' })
  async useService(@Request() req, @Param('id') id: string) {
    return this.servicesService.useService(req.user.id, id);
  }
}

