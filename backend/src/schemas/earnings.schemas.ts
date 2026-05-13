import { z } from 'zod';

export const withdrawSchema = z.object({
  amount:         z.number().positive(),
  bankAccountRib: z.string().min(24).max(34),
});

export const earningsPeriodSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
});

export const withdrawalListQuerySchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
