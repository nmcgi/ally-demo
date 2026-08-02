import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, FindOptionsWhere } from 'typeorm';
import { AccountEntity } from './entities/account.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { TransferDto } from './dto/transfer.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountsRepo: Repository<AccountEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepo: Repository<TransactionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllForUser(userId: string): Promise<AccountEntity[]> {
    return this.accountsRepo.find({ where: { userId, isActive: true } });
  }

  async findOne(id: string, userId: string): Promise<AccountEntity> {
    const account = await this.accountsRepo.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException();
    return account;
  }

  async getTransactions(accountId: string, userId: string, query: TransactionQueryDto) {
    await this.findOne(accountId, userId);

    const where: FindOptionsWhere<TransactionEntity> = { accountId };
    if (query.type) where.type = query.type;

    const [data, total] = await this.transactionsRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: query.limit ?? 25,
      skip: query.offset ?? 0,
    });

    return { data, total, limit: query.limit, offset: query.offset };
  }

  async transfer(userId: string, dto: TransferDto) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('Cannot transfer to the same account');
    }

    return this.dataSource.transaction(async (manager) => {
      const from = await manager.findOne(AccountEntity, { where: { id: dto.fromAccountId } });
      const to = await manager.findOne(AccountEntity, { where: { id: dto.toAccountId } });

      if (!from) throw new NotFoundException('Source account not found');
      if (!to) throw new NotFoundException('Destination account not found');
      if (from.userId !== userId) throw new ForbiddenException();
      if (Number(from.availableBalance) < dto.amount) {
        throw new BadRequestException('Insufficient funds');
      }

      from.balance = Number(from.balance) - dto.amount;
      from.availableBalance = Number(from.availableBalance) - dto.amount;
      to.balance = Number(to.balance) + dto.amount;
      to.availableBalance = Number(to.availableBalance) + dto.amount;

      await manager.save([from, to]);

      const debit = manager.create(TransactionEntity, {
        accountId: from.id,
        type: 'transfer_out',
        status: 'posted',
        amount: dto.amount,
        balance: from.balance,
        description: dto.memo ?? `Transfer to ${to.accountNumber}`,
        postedAt: new Date(),
      });

      const credit = manager.create(TransactionEntity, {
        accountId: to.id,
        type: 'transfer_in',
        status: 'posted',
        amount: dto.amount,
        balance: to.balance,
        description: dto.memo ?? `Transfer from ${from.accountNumber}`,
        postedAt: new Date(),
      });

      const [savedDebit] = await manager.save([debit, credit]);

      return {
        transactionId: savedDebit!.id,
        status: 'posted',
        amount: dto.amount,
        fromAccountId: from.id,
        toAccountId: to.id,
        createdAt: savedDebit!.createdAt.toISOString(),
      };
    });
  }
}
