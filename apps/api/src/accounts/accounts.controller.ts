import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { TransferDto } from './dto/transfer.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@ally/shared-types';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @ApiOperation({ summary: 'List accounts for authenticated user' })
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.accountsService.findAllForUser(user.sub);
  }

  @ApiOperation({ summary: 'Get account by ID' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.accountsService.findOne(id, user.sub);
  }

  @ApiOperation({ summary: 'List transactions for an account' })
  @Get(':id/transactions')
  getTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: TransactionQueryDto,
  ) {
    return this.accountsService.getTransactions(id, user.sub, query);
  }

  @ApiOperation({ summary: 'Transfer between accounts' })
  @Post('transfer')
  transfer(@CurrentUser() user: JwtPayload, @Body() dto: TransferDto) {
    return this.accountsService.transfer(user.sub, dto);
  }
}
