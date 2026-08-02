import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@ally/shared-types';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Create a payment' })
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(user.sub, dto);
  }

  @ApiOperation({ summary: 'List payments for authenticated user' })
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.findAllForUser(user.sub);
  }

  @ApiOperation({ summary: 'Get payment by ID' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.findOne(id, user.sub);
  }

  @ApiOperation({ summary: 'Cancel a scheduled or draft payment' })
  @Delete(':id')
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.cancel(id, user.sub);
  }
}
