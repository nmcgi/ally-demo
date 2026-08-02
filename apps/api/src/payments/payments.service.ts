import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repo: Repository<PaymentEntity>,
  ) {}

  async create(userId: string, dto: CreatePaymentDto): Promise<PaymentEntity> {
    if (!dto.toInternalAccountId && !(dto.toRoutingNumber && dto.toAccountNumber)) {
      throw new BadRequestException(
        'Either toInternalAccountId or both toRoutingNumber and toAccountNumber are required',
      );
    }

    const payment = this.repo.create({
      userId,
      fromAccountId: dto.fromAccountId,
      toRoutingNumber: dto.toRoutingNumber,
      toAccountNumber: dto.toAccountNumber,
      toInternalAccountId: dto.toInternalAccountId,
      method: dto.method,
      amount: dto.amount,
      memo: dto.memo,
      scheduledDate: dto.scheduledDate,
      status: dto.scheduledDate ? 'scheduled' : 'processing',
    });

    return this.repo.save(payment);
  }

  async findAllForUser(userId: string): Promise<PaymentEntity[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<PaymentEntity> {
    const payment = await this.repo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.userId !== userId) throw new ForbiddenException();
    return payment;
  }

  async cancel(id: string, userId: string): Promise<PaymentEntity> {
    const payment = await this.findOne(id, userId);
    if (!['draft', 'scheduled'].includes(payment.status)) {
      throw new BadRequestException('Only draft or scheduled payments can be cancelled');
    }
    payment.status = 'cancelled';
    return this.repo.save(payment);
  }
}
