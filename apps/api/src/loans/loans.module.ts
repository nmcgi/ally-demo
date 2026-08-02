import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { LoanApplicationEntity } from './entities/loan-application.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoanApplicationEntity])],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
