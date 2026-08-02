import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PaymentStatus, PaymentMethod } from '@ally/shared-types';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'from_account_id' })
  fromAccountId: string;

  @Column({ name: 'to_routing_number', nullable: true })
  toRoutingNumber?: string;

  @Column({ name: 'to_account_number', nullable: true })
  toAccountNumber?: string;

  @Column({ name: 'to_internal_account_id', nullable: true })
  toInternalAccountId?: string;

  @Column({ type: 'varchar' })
  method: PaymentMethod;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: PaymentStatus;

  @Column({ nullable: true })
  memo?: string;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate?: string;

  @Column({ name: 'processed_at', nullable: true })
  processedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
