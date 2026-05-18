import { ServiceType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError, ErrorCode } from '../utils/errors';
import { haversineKm } from '../utils/haversine';
import type { z } from 'zod';
import type { providerListQuerySchema, updateProviderSchema, updateLocationSchema } from '../schemas/provider.schemas';

type ListQuery       = z.infer<typeof providerListQuerySchema>;
type UpdateDto       = z.infer<typeof updateProviderSchema>;
type UpdateLocationDto = z.infer<typeof updateLocationSchema>;

const profileInclude = {
  user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true, email: true } },
  services: true,
  zones:    true,
} as const;

/** Liste des prestataires avec filtres. */
export async function listProviders(query: ListQuery) {
  const { page, limit, priceMin, priceMax, rating, service } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ProviderProfileWhereInput = {
    isVerified:  true,
    isAvailable: true,
    ...(rating   && { averageRating: { gte: rating } }),
    ...(priceMin !== undefined && { hourlyRateMin: { gte: priceMin } }),
    ...(priceMax !== undefined && { hourlyRateMax: { lte: priceMax } }),
    ...(service  && { services: { some: { serviceType: service } } }),
    ...(query.search && {
      user: {
        OR: [
          { firstName: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          { lastName:  { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        ],
      },
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.providerProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { averageRating: 'desc' },
      include: profileInclude,
    }),
    prisma.providerProfile.count({ where }),
  ]);

  // Filtre géographique côté applicatif si lat/lng fournis
  if (query.lat !== undefined && query.lng !== undefined) {
    const radius = query.radiusKm ?? 20;
    const filtered = items.filter((p) => {
      if (!p.latitude || !p.longitude) return false;
      return haversineKm(query.lat!, query.lng!, Number(p.latitude), Number(p.longitude)) <= radius;
    });
    return { items: filtered, total: filtered.length };
  }

  return { items, total };
}

/** Prestataires proches par géolocalisation. */
export async function getNearbyProviders(
  lat: number, lng: number, radiusKm: number,
  serviceType?: ServiceType, page = 1, limit = 10,
) {
  const candidates = await prisma.providerProfile.findMany({
    where: {
      isVerified:  true,
      isAvailable: true,
      latitude:    { not: null },
      longitude:   { not: null },
      ...(serviceType && { services: { some: { serviceType } } }),
    },
    include: profileInclude,
  });

  const withDistance = candidates
    .map((p) => ({
      ...p,
      distanceKm: haversineKm(lat, lng, Number(p.latitude), Number(p.longitude)),
    }))
    .filter((p) => p.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const skip  = (page - 1) * limit;
  return { items: withDistance.slice(skip, skip + limit), total: withDistance.length };
}

/** Fiche détaillée d'un prestataire. */
export async function getProviderById(id: string) {
  const profile = await prisma.providerProfile.findUnique({
    where:   { id },
    include: { ...profileInclude, zones: true },
  });
  if (!profile) throw AppError.notFound(ErrorCode.PROVIDER_NOT_FOUND, 'Prestataire introuvable');
  return profile;
}

/** Disponibilités pour la semaine à venir (créneaux occupés). */
export async function getProviderAvailability(providerId: string) {
  const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
  if (!provider) throw AppError.notFound(ErrorCode.PROVIDER_NOT_FOUND, 'Prestataire introuvable');

  const today   = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const bookings = await prisma.booking.findMany({
    where: {
      providerId:    provider.userId,
      status:        { in: ['CONFIRMED', 'IN_PROGRESS'] },
      scheduledDate: { gte: today, lte: weekEnd },
    },
    select: { scheduledDate: true, scheduledTime: true, durationHours: true },
  });

  return {
    providerId,
    isAvailable: provider.isAvailable,
    isOnline:    provider.isOnline,
    bookedSlots: bookings,
  };
}

/** Modifier le profil prestataire. */
export async function updateProviderProfile(userId: string, dto: UpdateDto) {
  const profile = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!profile) throw AppError.notFound(ErrorCode.PROVIDER_NOT_FOUND, 'Profil prestataire introuvable');

  return prisma.providerProfile.update({
    where: { userId },
    data:  dto,
    include: profileInclude,
  });
}

/** Met à jour la position GPS en temps réel. */
export async function updateProviderLocation(userId: string, dto: UpdateLocationDto) {
  const data: Prisma.ProviderProfileUpdateInput = {
    latitude:  dto.latitude,
    longitude: dto.longitude,
  };
  if (dto.isOnline !== undefined) data.isOnline = dto.isOnline;

  return prisma.providerProfile.update({ where: { userId }, data });
}

/** Enregistre les URLs des documents uploadés. */
export async function uploadDocuments(
  userId: string,
  docs: { cinFrontUrl?: string; cinBackUrl?: string; portraitUrl?: string },
) {
  return prisma.providerProfile.update({
    where: { userId },
    data:  docs,
  });
}

// ─── Statistiques tableau de bord prestataire ─────────────────────────────────

export async function getProviderStats(userId: string) {
  const profile = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!profile) throw AppError.notFound(ErrorCode.PROVIDER_NOT_FOUND, 'Profil prestataire introuvable');

  const now        = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyAgo  = new Date(now); thirtyAgo.setDate(now.getDate() - 30);

  const [
    todayMissions, monthMissions,
    todayEarningsRaw,
    confirmedLast30, cancelledLast30,
  ] = await Promise.all([
    prisma.booking.count({
      where: { providerId: userId, status: 'COMPLETED', completedAt: { gte: todayStart } },
    }),
    prisma.booking.count({
      where: { providerId: userId, status: 'COMPLETED', completedAt: { gte: monthStart } },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'PAYMENT', status: 'SUCCESS', createdAt: { gte: todayStart } },
      _sum: { amount: true },
    }),
    prisma.booking.count({
      where: { providerId: userId, status: 'CONFIRMED', createdAt: { gte: thirtyAgo } },
    }),
    prisma.booking.count({
      where: { providerId: userId, status: 'CANCELLED', createdAt: { gte: thirtyAgo } },
    }),
  ]);

  const total = confirmedLast30 + cancelledLast30;
  const acceptanceRate = total > 0 ? Math.round((confirmedLast30 / total) * 100) : 100;

  return {
    todayMissions,
    todayEarnings:  parseFloat(Number(todayEarningsRaw._sum.amount ?? 0).toFixed(2)),
    averageRating:  Number(profile.averageRating),
    monthMissions,
    acceptanceRate,
    isAvailable:    profile.isAvailable,
    isOnline:       profile.isOnline,
  };
}

// ─── Patch rapide disponibilité / statut ──────────────────────────────────────

export async function patchProviderMe(
  userId: string,
  data: { isAvailable?: boolean; isOnline?: boolean },
) {
  const profile = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!profile) throw AppError.notFound(ErrorCode.PROVIDER_NOT_FOUND, 'Profil prestataire introuvable');
  return prisma.providerProfile.update({ where: { userId }, data });
}
