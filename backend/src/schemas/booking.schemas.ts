import { z } from 'zod';
import { ServiceType, PaymentMethod, BookingStatus } from '@prisma/client';

export const createBookingSchema = z.object({
  providerId:    z.string().uuid(),
  addressId:     z.string().uuid(),
  serviceType:   z.nativeEnum(ServiceType),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD'),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format HH:MM'),
  durationHours: z.number().min(1).max(12),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  clientNotes:   z.string().max(500).optional(),
});

export const declineBookingSchema = z.object({
  reason: z.string().min(5).max(500),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(5).max(500),
});

export const quoteQuerySchema = z.object({
  providerId:    z.string().uuid(),
  serviceType:   z.nativeEnum(ServiceType),
  durationHours: z.coerce.number().min(1).max(12),
});

export const bookingListQuerySchema = z.object({
  status:    z.nativeEnum(BookingStatus).optional(),
  dateFrom:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().min(1).max(50).default(10),
});
