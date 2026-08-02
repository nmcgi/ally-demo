import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserEntity } from '../users/entities/user.entity';
import { AccountEntity } from '../accounts/entities/account.entity';
import { LoanApplicationEntity } from '../loans/entities/loan-application.entity';
import { LoansModule } from '../loans/loans.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, AccountEntity, LoanApplicationEntity]),
    LoansModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
