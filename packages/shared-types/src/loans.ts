import { z } from 'zod';

export const LoanTypeSchema = z.enum(['auto', 'personal', 'home_equity', 'mortgage']);

export const LoanStatusSchema = z.enum([
  'draft',
  'submitted',
  'kyc_pending',
  'kyc_approved',
  'kyc_failed',
  'credit_check_pending',
  'credit_check_approved',
  'credit_check_failed',
  'underwriting',
  'approved',
  'rejected',
  'disbursed',
  'closed',
]);

export const EmploymentTypeSchema = z.enum([
  'employed',
  'self_employed',
  'unemployed',
  'retired',
  'student',
]);

export const LoanApplicationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: LoanTypeSchema,
  status: LoanStatusSchema,
  requestedAmount: z.number().positive(),
  termMonths: z.number().int().positive(),
  purpose: z.string().max(255),
  annualIncome: z.number().nonnegative(),
  employmentType: EmploymentTypeSchema,
  employer: z.string().optional(),
  creditScore: z.number().int().min(300).max(850).optional(),
  approvedAmount: z.number().positive().optional(),
  approvedRate: z.number().min(0).max(100).optional(),
  stepFunctionsExecutionArn: z.string().optional(),
  decisionReason: z.string().optional(),
  submittedAt: z.string().datetime().optional(),
  decidedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateLoanApplicationRequestSchema = z.object({
  type: LoanTypeSchema,
  requestedAmount: z.number().positive(),
  termMonths: z.number().int().positive(),
  purpose: z.string().min(1).max(255),
  annualIncome: z.number().nonnegative(),
  employmentType: EmploymentTypeSchema,
  employer: z.string().optional(),
});

export const LoanApplicationStatusResponseSchema = z.object({
  id: z.string().uuid(),
  status: LoanStatusSchema,
  stepFunctionsExecutionArn: z.string().optional(),
  approvedAmount: z.number().optional(),
  approvedRate: z.number().optional(),
  decisionReason: z.string().optional(),
  updatedAt: z.string().datetime(),
});

export type LoanType = z.infer<typeof LoanTypeSchema>;
export type LoanStatus = z.infer<typeof LoanStatusSchema>;
export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;
export type LoanApplication = z.infer<typeof LoanApplicationSchema>;
export type CreateLoanApplicationRequest = z.infer<typeof CreateLoanApplicationRequestSchema>;
export type LoanApplicationStatusResponse = z.infer<typeof LoanApplicationStatusResponseSchema>;
