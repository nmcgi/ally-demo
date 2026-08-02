import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { LoanType, LoanStatus, EmploymentType } from '@ally/shared-types';

@Entity('loan_applications')
export class LoanApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar' })
  type: LoanType;

  @Column({ type: 'varchar', default: 'draft' })
  status: LoanStatus;

  @Column({ name: 'requested_amount', type: 'decimal', precision: 15, scale: 2 })
  requestedAmount: number;

  @Column({ name: 'term_months' })
  termMonths: number;

  @Column()
  purpose: string;

  @Column({ name: 'annual_income', type: 'decimal', precision: 15, scale: 2 })
  annualIncome: number;

  @Column({ name: 'employment_type', type: 'varchar' })
  employmentType: EmploymentType;

  @Column({ nullable: true })
  employer?: string;

  @Column({ name: 'credit_score', nullable: true })
  creditScore?: number;

  @Column({ name: 'approved_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  approvedAmount?: number;

  @Column({ name: 'approved_rate', type: 'decimal', precision: 5, scale: 4, nullable: true })
  approvedRate?: number;

  @Column({ name: 'step_functions_execution_arn', nullable: true })
  stepFunctionsExecutionArn?: string;

  @Column({ name: 'decision_reason', nullable: true })
  decisionReason?: string;

  @Column({ name: 'submitted_at', nullable: true })
  submittedAt?: Date;

  @Column({ name: 'decided_at', nullable: true })
  decidedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
