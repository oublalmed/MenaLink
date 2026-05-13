import { z } from 'zod';
import { ServiceType } from '@prisma/client';

export const updateProviderSchema = z.object({
  bio:            z.string().max(500).optional(),
  hourlyRateMin:  z.number().positive().optional(),
  hourlyRateMax:  z.number().positive().optional(),
  serviceRadiusKm: z.number().int().min(1).max(100).optional(),
  isAvailable:    z.boolean().optional(),
}).refine(
  (d) => {
    if (d.hourlyRateMin !== undefined && d.hourlyRateMax !== undefined) {
      return d.hourlyRateMax >= d.hourlyRateMin;
    }
    return true;
  },
  { message: 'hourlyRateMax doit être ≥ hourlyRateMin', path: ['hourlyRateMax'] },
);

export const updateLocationSchema = z.object({
  latitude:  z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isOnline:  z.boolean().optional(),
});

export const nearbyQuerySchema = z.object({
  lat:       z.coerce.number().min(-90).max(90),
  lng:       z.coerce.number().min(-180).max(180),
  radiusKm:  z.coerce.number().positive().max(100).default(20),
  service:   z.nativeEnum(ServiceType).optional(),
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().min(1).max(50).default(10),
});

export const providerListQuerySchema = z.object({
  lat:      z.coerce.number().optional(),
  lng:      z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().max(100).optional(),
  service:  z.nativeEnum(ServiceType).optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().positive().optional(),
  rating:   z.coerce.number().min(1).max(5).optional(),
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD').optional(),
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().min(1).max(50).default(10),
  search:   z.string().max(100).optional(),
});
