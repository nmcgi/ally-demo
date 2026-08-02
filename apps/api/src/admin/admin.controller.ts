import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ReviewLoanDto } from './dto/review-loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'support')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Search customers by email or name' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @Get('users')
  searchUsers(@Query('q') q: string) {
    return this.adminService.searchUsers(q ?? '');
  }

  @ApiOperation({ summary: "Get a customer's accounts (masked account numbers)" })
  @Get('users/:id/accounts')
  getUserAccounts(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserAccounts(id);
  }

  @ApiOperation({ summary: 'List pending loan applications' })
  @Get('loans/pending')
  getPendingLoans() {
    return this.adminService.getPendingLoanApplications();
  }

  @ApiOperation({ summary: 'Approve or reject a loan application' })
  @Roles('admin')
  @Post('loans/:id/review')
  reviewLoan(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewLoanDto) {
    return dto.decision === 'approved'
      ? this.adminService.approveLoan(id)
      : this.adminService.rejectLoan(id, dto.reason ?? 'Application rejected');
  }
}
