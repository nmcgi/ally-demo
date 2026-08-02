import { z } from 'zod';

export const PaymentStatusSchema = z.enum([
  'draft',
  'scheduled',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const PaymentMethodSchema = z.enum(['ach', 'wire', 'internal']);

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fromAccountId: z.string().uuid(),
  toRoutingNumber: z.string().optional(),
  toAccountNumber: z.string().optional(),
  toInternalAccountId: z.string().uuid().optional(),
  method: PaymentMethodSchema,
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  status: PaymentStatusSchema,
  memo: z.string().max(140).optional(),
  scheduledDate: z.string().date().optional(),
  processedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreatePaymentRequestSchema = z.object({
  fromAccountId: z.string().uuid(),
  toRoutingNumber: z.string().optional(),
  toAccountNumber: z.string().optional(),
  toInternalAccountId: z.string().uuid().optional(),
  method: PaymentMethodSchema,
  amount: z.number().positive(),
  memo: z.string().max(140).optional(),
  scheduledDate: z.string().date().optional(),
}).refine(
  (data) =>
    data.toInternalAccountId !== undefined ||
    (data.toRoutingNumber !== undefined && data.toAccountNumber !== undefined),
  {
    message: 'Either toInternalAccountId or both toRoutingNumber and toAccountNumber are required',
  },
);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;
