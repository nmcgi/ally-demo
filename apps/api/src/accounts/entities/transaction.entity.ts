import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AccountEntity } from './account.entity';
import { TransactionType, TransactionStatus } from '@ally/shared-types';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => AccountEntity, (a) => a.transactions)
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity;

  @Column({ type: 'varchar' })
  type: TransactionType;

  @Column({ type: 'varchar', default: 'pending' })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  balance: number;

  @Column()
  description: string;

  @Column({ name: 'merchant_name', nullable: true })
  merchantName?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ name: 'posted_at', nullable: true })
  postedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
