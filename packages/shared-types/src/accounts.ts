import { z } from 'zod';

export const AccountTypeSchema = z.enum(['checking', 'savings', 'money_market']);

export const AccountSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  accountNumber: z.string(),
  type: AccountTypeSchema,
  balance: z.number(),
  availableBalance: z.number(),
  currency: z.string().default('USD'),
  nickname: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TransactionTypeSchema = z.enum([
  'debit',
  'credit',
  'transfer_in',
  'transfer_out',
  'fee',
  'interest',
]);

export const TransactionStatusSchema = z.enum([
  'pending',
  'posted',
  'failed',
  'reversed',
]);

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  type: TransactionTypeSchema,
  status: TransactionStatusSchema,
  amount: z.number(),
  balance: z.number(),
  description: z.string(),
  merchantName: z.string().optional(),
  category: z.string().optional(),
  postedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export const TransferRequestSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
  memo: z.string().max(140).optional(),
});

export const TransferResponseSchema = z.object({
  transactionId: z.string().uuid(),
  status: TransactionStatusSchema,
  amount: z.number(),
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export const TransactionListQuerySchema = z.object({
  accountId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  type: TransactionTypeSchema.optional(),
});

export type AccountType = z.infer<typeof AccountTypeSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransferRequest = z.infer<typeof TransferRequestSchema>;
export type TransferResponse = z.infer<typeof TransferResponseSchema>;
export type TransactionListQuery = z.infer<typeof TransactionListQuerySchema>;
