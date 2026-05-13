import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating:    z.number().int().min(1).max(5),
  comment:   z.string().max(1000).optional(),
});

export const replyReviewSchema = z.object({
  reply: z.string().min(5).max(500),
});

export const reviewQuerySchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort:  z.enum(['recent', 'rating_asc', 'rating_desc']).default('recent'),
});
