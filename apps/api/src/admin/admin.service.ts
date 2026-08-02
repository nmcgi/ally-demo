import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { AccountEntity } from '../accounts/entities/account.entity';
import { LoanApplicationEntity } from '../loans/entities/loan-application.entity';
import { LoansService } from '../loans/loans.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountsRepo: Repository<AccountEntity>,
    @InjectRepository(LoanApplicationEntity)
    private readonly loansRepo: Repository<LoanApplicationEntity>,
    private readonly loansService: LoansService,
  ) {}

  async searchUsers(query: string) {
    const users = await this.usersRepo
      .createQueryBuilder('u')
      .where('u.email ILIKE :q OR u.first_name ILIKE :q OR u.last_name ILIKE :q', {
        q: `%${query}%`,
      })
      .select(['u.id', 'u.email', 'u.firstName', 'u.lastName', 'u.role', 'u.createdAt'])
      .take(50)
      .getMany();

    return users;
  }

  async getUserAccounts(userId: string) {
    const accounts = await this.accountsRepo.find({ where: { userId } });
    return accounts.map((a) => ({
      ...a,
      accountNumber: `****${a.accountNumber.slice(-4)}`,
    }));
  }

  async getPendingLoanApplications() {
    return this.loansRepo.find({
      where: [
        { status: 'submitted' },
        { status: 'kyc_pending' },
        { status: 'credit_check_pending' },
        { status: 'underwriting' },
      ],
      order: { submittedAt: 'ASC' },
    });
  }

  async approveLoan(id: string) {
    return this.loansService.updateStatus(id, 'approved', { decidedAt: new Date() });
  }

  async rejectLoan(id: string, reason: string) {
    return this.loansService.updateStatus(id, 'rejected', {
      decidedAt: new Date(),
      decisionReason: reason,
    });
  }
}
