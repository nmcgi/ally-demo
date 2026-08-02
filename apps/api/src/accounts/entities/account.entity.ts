import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { TransactionEntity } from './transaction.entity';
import { AccountType } from '@ally/shared-types';

@Entity('accounts')
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'account_number', unique: true })
  accountNumber: string;

  @Column({ type: 'varchar' })
  type: AccountType;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'available_balance', type: 'decimal', precision: 15, scale: 2, default: 0 })
  availableBalance: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ nullable: true })
  nickname?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => TransactionEntity, (tx) => tx.account)
  transactions: TransactionEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
