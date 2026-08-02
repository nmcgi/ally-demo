import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
  });

export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  message: z.string().or(z.array(z.string())),
  error: z.string().optional(),
  correlationId: z.string().optional(),
});

export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
};
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
