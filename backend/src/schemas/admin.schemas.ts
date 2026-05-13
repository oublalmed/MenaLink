import { z } from 'zod';
import { UserStatus, BookingStatus } from '@prisma/client';

export const adminUserListSchema = z.object({
  role:    z.enum(['CLIENT', 'PROVIDER', 'ADMIN']).optional(),
  status:  z.nativeEnum(UserStatus).optional(),
  search:  z.string().max(100).optional(),
  page:    z.coerce.number().int().positive().default(1),
  limit:   z.coerce.number().int().min(1).max(100).default(20),
});

export const adminUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
  reason: z.string().max(500).optional(),
});

export const adminVerifyProviderSchema = z.object({
  approved: z.boolean(),
  reason:   z.string().max(500).optional(),
});

export const adminBookingListSchema = z.object({
  status:    z.nativeEnum(BookingStatus).optional(),
  dateFrom:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  clientId:  z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
});

export const adminResolveDisputeSchema = z.object({
  resolution: z.string().min(10).max(2000),
  status:     z.enum(['RESOLVED', 'CLOSED']),
});

export const adminSettingSchema = z.object({
  value:       z.string().min(1),
  description: z.string().optional(),
});
