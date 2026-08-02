import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountEntity } from './entities/account.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { DataSource } from 'typeorm';

const mockAccount = (overrides: Partial<AccountEntity> = {}): AccountEntity =>
  ({
    id: 'acct-1',
    userId: 'user-1',
    accountNumber: '123456789',
    type: 'checking',
    balance: 1000,
    availableBalance: 1000,
    currency: 'USD',
    isActive: true,
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as AccountEntity;

describe('AccountsService', () => {
  let service: AccountsService;

  const mockAccountsRepo = { find: jest.fn(), findOne: jest.fn() };
  const mockTxRepo = { findAndCount: jest.fn() };
  const mockDataSource = { transaction: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: getRepositoryToken(AccountEntity), useValue: mockAccountsRepo },
        { provide: getRepositoryToken(TransactionEntity), useValue: mockTxRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findOne', () => {
    it('throws NotFoundException when account missing', async () => {
      mockAccountsRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('x', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own account', async () => {
      mockAccountsRepo.findOne.mockResolvedValue(mockAccount({ userId: 'other-user' }));
      await expect(service.findOne('acct-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('returns account for owner', async () => {
      const account = mockAccount();
      mockAccountsRepo.findOne.mockResolvedValue(account);
      expect(await service.findOne('acct-1', 'user-1')).toBe(account);
    });
  });

  describe('transfer', () => {
    it('throws BadRequestException on same account transfer', async () => {
      await expect(
        service.transfer('user-1', { fromAccountId: 'a', toAccountId: 'a', amount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
