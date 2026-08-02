import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@ally/shared-types';

@ApiTags('loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @ApiOperation({ summary: 'Create a loan application (draft)' })
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLoanApplicationDto) {
    return this.loansService.create(user.sub, dto);
  }

  @ApiOperation({ summary: 'Submit a loan application (triggers Step Functions)' })
  @Post(':id/submit')
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.loansService.submit(id, user.sub);
  }

  @ApiOperation({ summary: 'List loan applications for authenticated user' })
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.loansService.findAllForUser(user.sub);
  }

  @ApiOperation({ summary: 'Get loan application status' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.loansService.findOne(id, user.sub);
  }
}
