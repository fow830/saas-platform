import { Controller, Get, Post, Patch, UseGuards, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateAdminDto } from './dto/create-admin.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('projects')
  @ApiOperation({ summary: 'Get all projects (paginated)' })
  async getProjects(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAllUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('admins')
  @ApiOperation({ summary: 'Get all admins (paginated)' })
  async getAdmins(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAllAdmins(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Post('admins')
  @ApiOperation({ summary: 'Create a new admin (Admin only)' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.createAdmin(createAdminDto);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions (paginated)' })
  async getSubscriptions(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAllSubscriptions(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Patch('projects/:id/status')
  @ApiOperation({ summary: 'Update project status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async updateProjectStatus(
    @Param('id') projectId: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED',
  ) {
    return this.adminService.updateUserStatus(projectId, status);
  }

  @Patch('projects/:id')
  @ApiOperation({ summary: 'Update project info (email, name) (Admin only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async updateProjectInfo(@Param('id') projectId: string, @Body() updateData: { email?: string; firstName?: string }) {
    return this.adminService.updateUserInfo(projectId, updateData);
  }

  @Patch('projects/:id/password')
  @ApiOperation({ summary: 'Update project password (Admin only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async updateProjectPassword(
    @Param('id') projectId: string,
    @Body('password') newPassword: string,
  ) {
    return this.adminService.updateUserPassword(projectId, newPassword);
  }

  @Get('projects/:id/generate-password')
  @ApiOperation({ summary: 'Generate temporary password and show it (Admin only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async generateTemporaryPassword(@Param('id') projectId: string) {
    return this.adminService.generateTemporaryPassword(projectId);
  }
}

