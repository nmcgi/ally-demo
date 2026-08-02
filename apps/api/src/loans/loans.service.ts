import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  SFNClient,
  StartExecutionCommand,
} from '@aws-sdk/client-sfn';
import { LoanApplicationEntity } from './entities/loan-application.entity';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';

@Injectable()
export class LoansService {
  private readonly sfn: SFNClient;

  constructor(
    @InjectRepository(LoanApplicationEntity)
    private readonly repo: Repository<LoanApplicationEntity>,
    private readonly config: ConfigService,
  ) {
    this.sfn = new SFNClient({ region: this.config.get('AWS_REGION', 'us-east-1') });
  }

  async create(userId: string, dto: CreateLoanApplicationDto): Promise<LoanApplicationEntity> {
    const application = this.repo.create({ userId, ...dto, status: 'draft' });
    return this.repo.save(application);
  }

  async submit(id: string, userId: string): Promise<LoanApplicationEntity> {
    const application = await this.findOne(id, userId);

    if (application.status !== 'draft') {
      throw new BadRequestException('Only draft applications can be submitted');
    }

    application.status = 'submitted';
    application.submittedAt = new Date();
    await this.repo.save(application);

    const stateMachineArn = this.config.get<string>('STEP_FUNCTIONS_LOAN_ARN');
    if (stateMachineArn) {
      const command = new StartExecutionCommand({
        stateMachineArn,
        name: `loan-${application.id}`,
        input: JSON.stringify({ loanApplicationId: application.id, userId }),
      });
      const execution = await this.sfn.send(command);
      application.stepFunctionsExecutionArn = execution.executionArn;
      application.status = 'kyc_pending';
      await this.repo.save(application);
    }

    return application;
  }

  async findAllForUser(userId: string): Promise<LoanApplicationEntity[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<LoanApplicationEntity> {
    const application = await this.repo.findOne({ where: { id } });
    if (!application) throw new NotFoundException('Loan application not found');
    if (application.userId !== userId) throw new ForbiddenException();
    return application;
  }

  async updateStatus(
    id: string,
    status: LoanApplicationEntity['status'],
    extras?: Partial<LoanApplicationEntity>,
  ): Promise<LoanApplicationEntity> {
    const application = await this.repo.findOne({ where: { id } });
    if (!application) throw new NotFoundException('Loan application not found');
    Object.assign(application, { status, ...extras });
    return this.repo.save(application);
  }
}
