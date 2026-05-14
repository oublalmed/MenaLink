import { UserStatus, BookingStatus, DisputeStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError, ErrorCode } from '../utils/errors';
import { sendPushNotification } from './notification.service';
import type { z } from 'zod';
import type {
  adminUserListSchema, adminUserStatusSchema, adminVerifyProviderSchema,
  adminBookingListSchema, adminResolveDisputeSchema, adminSettingSchema,
} from '../schemas/admin.schemas';

type UserListQuery       = z.infer<typeof adminUserListSchema>;
type UserStatusDto       = z.infer<typeof adminUserStatusSchema>;
type VerifyProviderDto   = z.infer<typeof adminVerifyProviderSchema>;
type BookingListQuery    = z.infer<typeof adminBookingListSchema>;
type ResolveDisputeDto   = z.infer<typeof adminResolveDisputeSchema>;
type SettingDto          = z.infer<typeof adminSettingSchema>;

// ─── KPIs Dashboard ───────────────────────────────────────────────────────────

export async function getDashboardKPIs() {
  const now          = new Date();
  const monthAgo     = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

  // ── Core counts ───────────────────────────────────────────────────────────
  const [
    totalUsers, totalBookings, completedBookings,
    totalRevRaw, lastMonthRevRaw, prevMonthRevRaw,
    activeUsersCount, activeProvidersCount, openDisputesCount,
    bookingStatusCounts, recentBookingsList, pendingProvidersList,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
    prisma.transaction.aggregate({ where: { type: 'COMMISSION', status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'COMMISSION', status: 'SUCCESS', createdAt: { gte: monthAgo } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'COMMISSION', status: 'SUCCESS', createdAt: { gte: twoMonthsAgo, lt: monthAgo } }, _sum: { amount: true } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.providerProfile.count({ where: { isAvailable: true, isVerified: true } }),
    prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
    prisma.booking.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.booking.findMany({
      take: 10, orderBy: { createdAt: 'desc' },
      include: {
        client:   { select: { firstName: true, lastName: true, email: true } },
        provider: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.providerProfile.findMany({
      where: { isVerified: false },
      take: 10, orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } }, services: { select: { serviceType: true } } },
    }),
  ]);

  // ── Revenue trend ─────────────────────────────────────────────────────────
  const lastMonthRev = Number(lastMonthRevRaw._sum.amount ?? 0);
  const prevMonthRev = Number(prevMonthRevRaw._sum.amount ?? 0);
  const revenueTrend = prevMonthRev > 0
    ? parseFloat((((lastMonthRev - prevMonthRev) / prevMonthRev) * 100).toFixed(1))
    : lastMonthRev > 0 ? 100 : 0;

  // ── Bookings by status ────────────────────────────────────────────────────
  const bbs: Record<string, number> = { PENDING: 0, CONFIRMED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, DISPUTED: 0 };
  for (const row of bookingStatusCounts) bbs[row.status] = (bbs[row.status] ?? 0) + row._count.id;

  // ── Monthly revenue (last 6 months) ──────────────────────────────────────
  const monthlyRevenue: { month: string; revenue: number; bookings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const to   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const [rev, cnt] = await Promise.all([
      prisma.transaction.aggregate({ where: { type: 'COMMISSION', status: 'SUCCESS', createdAt: { gte: from, lt: to } }, _sum: { amount: true } }),
      prisma.booking.count({ where: { createdAt: { gte: from, lt: to } } }),
    ]);
    monthlyRevenue.push({
      month:    from.toLocaleDateString('fr-MA', { month: 'short', year: '2-digit' }),
      revenue:  parseFloat((Number(rev._sum.amount ?? 0)).toFixed(2)),
      bookings: cnt,
    });
  }

  // ── Daily bookings (last 7 days) ──────────────────────────────────────────
  const dailyBookings: { date: string; PENDING: number; CONFIRMED: number; COMPLETED: number; CANCELLED: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const from = new Date(now); from.setDate(now.getDate() - i); from.setHours(0, 0, 0, 0);
    const to   = new Date(from); to.setDate(from.getDate() + 1);
    const rows = await prisma.booking.groupBy({ by: ['status'], where: { createdAt: { gte: from, lt: to } }, _count: { id: true } });
    const day: Record<string, number> = { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
    for (const r of rows) if (r.status in day) day[r.status] = r._count.id;
    dailyBookings.push({ date: from.toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit' }), ...day } as typeof dailyBookings[number]);
  }

  // ── Recent bookings ───────────────────────────────────────────────────────
  const recentBookings = recentBookingsList.map(b => ({
    id:            b.id,
    client:        b.client,
    provider:      b.provider?.user ?? null,
    serviceType:   b.serviceType,
    scheduledDate: b.scheduledDate,
    totalAmount:   Number(b.totalAmount),
    status:        b.status,
  }));

  // ── Pending providers ─────────────────────────────────────────────────────
  const pendingProviders = pendingProvidersList.map(p => ({
    id:           p.user.id,
    firstName:    p.user.firstName,
    lastName:     p.user.lastName,
    email:        p.user.email,
    createdAt:    p.user.createdAt,
    serviceTypes: p.services.map(s => s.serviceType),
  }));

  const conversionRate = totalBookings > 0
    ? parseFloat(((completedBookings / totalBookings) * 100).toFixed(1))
    : 0;

  return {
    totalRevenue:    parseFloat((Number(totalRevRaw._sum.amount ?? 0)).toFixed(2)),
    revenueTrend,
    totalBookings,
    bookingsByStatus: bbs as Record<'PENDING'|'CONFIRMED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED'|'DISPUTED', number>,
    totalActiveUsers: activeUsersCount,
    conversionRate,
    activeProviders:  activeProvidersCount,
    openDisputes:     openDisputesCount,
    monthlyRevenue,
    dailyBookings,
    recentBookings,
    pendingProviders,
  };
}

// ─── Gestion utilisateurs ─────────────────────────────────────────────────────

export async function listUsers(query: UserListQuery) {
  const { page, limit, role, status, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    ...(role   && { role: role as never }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { lastName:  { contains: search, mode: Prisma.QueryMode.insensitive } },
        { email:     { contains: search, mode: Prisma.QueryMode.insensitive } },
        { phone:     { contains: search } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take:     limit,
      orderBy:  { createdAt: 'desc' },
      select:   {
        id: true, email: true, phone: true,
        firstName: true, lastName: true,
        role: true, status: true, avatarUrl: true,
        createdAt: true, lastLoginAt: true,
        _count: { select: { clientBookings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total };
}

export async function setUserStatus(userId: string, dto: UserStatusDto) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
  if (!user) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Utilisateur introuvable');

  const updated = await prisma.user.update({
    where:  { id: userId },
    data:   { status: dto.status },
    select: { id: true, email: true, status: true },
  });

  const statusLabels: Record<UserStatus, string> = {
    PENDING:   'en attente',
    ACTIVE:    'activé',
    SUSPENDED: 'suspendu',
    BANNED:    'banni',
  };
  await sendPushNotification(userId, {
    title: 'Statut du compte modifié',
    body:  `Votre compte a été ${statusLabels[dto.status]}.${dto.reason ? ` Motif : ${dto.reason}` : ''}`,
    data:  { type: 'ACCOUNT_STATUS_CHANGED', status: dto.status },
  });

  return updated;
}

// ─── Vérification prestataires ────────────────────────────────────────────────

export async function listPendingProviders(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await prisma.$transaction([
    prisma.providerProfile.findMany({
      where:   { isVerified: false },
      skip,
      take:    limit,
      orderBy: { user: { createdAt: 'asc' } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true } },
        services: true,
        zones:    true,
      },
    }),
    prisma.providerProfile.count({ where: { isVerified: false } }),
  ]);
  return { items, total };
}

export async function verifyProvider(providerId: string, adminId: string, dto: VerifyProviderDto) {
  const profile = await prisma.providerProfile.findUnique({
    where:   { id: providerId },
    include: { user: { select: { id: true } } },
  });
  if (!profile) throw AppError.notFound(ErrorCode.PROVIDER_NOT_FOUND, 'Prestataire introuvable');

  const data: Prisma.ProviderProfileUpdateInput = dto.approved
    ? { isVerified: true, verifiedAt: new Date(), verifiedBy: adminId }
    : { isVerified: false };

  if (dto.approved) {
    await prisma.user.update({
      where: { id: profile.user.id },
      data:  { status: UserStatus.ACTIVE },
    });
  }

  const updated = await prisma.providerProfile.update({ where: { id: providerId }, data });

  await sendPushNotification(profile.user.id, {
    title: dto.approved ? 'Compte prestataire approuvé' : 'Compte prestataire refusé',
    body:  dto.approved
      ? 'Félicitations ! Votre compte a été vérifié. Vous pouvez maintenant recevoir des réservations.'
      : `Votre dossier a été refusé.${dto.reason ? ` Motif : ${dto.reason}` : ''}`,
    data: { type: 'PROVIDER_VERIFICATION', approved: String(dto.approved) },
  });

  return updated;
}

// ─── Réservations admin ───────────────────────────────────────────────────────

export async function listAllBookings(query: BookingListQuery) {
  const { page, limit, status, dateFrom, dateTo, clientId, providerId } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.BookingWhereInput = {
    ...(status     && { status }),
    ...(clientId   && { clientId }),
    ...(providerId && { providerId }),
    ...(dateFrom   && { scheduledDate: { gte: new Date(dateFrom) } }),
    ...(dateTo     && { scheduledDate: { lte: new Date(dateTo)   } }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      skip,
      take:     limit,
      orderBy:  { createdAt: 'desc' },
      include:  { address: true, review: true },
    }),
    prisma.booking.count({ where }),
  ]);

  return { items, total };
}

// ─── Litiges ──────────────────────────────────────────────────────────────────

export async function listDisputes(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await prisma.$transaction([
    prisma.dispute.findMany({
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        booking:  { select: { id: true, serviceType: true, totalAmount: true } },
        reporter: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.dispute.count(),
  ]);
  return { items, total };
}

export async function resolveDispute(disputeId: string, adminId: string, dto: ResolveDisputeDto) {
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Litige introuvable');

  return prisma.dispute.update({
    where: { id: disputeId },
    data:  {
      status:     dto.status as DisputeStatus,
      resolution: dto.resolution,
      assignedTo: adminId,
      resolvedAt: new Date(),
    },
  });
}

// ─── Paramètres application ───────────────────────────────────────────────────

export async function getSettings() {
  return prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
}

export async function updateSetting(key: string, dto: SettingDto) {
  return prisma.appSetting.upsert({
    where:  { key },
    create: { key, value: dto.value, description: dto.description },
    update: { value: dto.value, ...(dto.description && { description: dto.description }) },
  });
}

// ─── Prestataires admin ───────────────────────────────────────────────────────

export async function listAllProviders(query: { page: number; limit: number; status?: string; search?: string }) {
  const { page, limit, status, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ProviderProfileWhereInput = {
    ...(status === 'PENDING'    && { isVerified: false }),
    ...(status === 'ACTIVE'     && { isVerified: true, user: { status: 'ACTIVE' } }),
    ...(status === 'SUSPENDED'  && { user: { status: 'SUSPENDED' } }),
    ...(search && {
      user: {
        OR: [
          { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { lastName:  { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email:     { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      },
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.providerProfile.findMany({
      where, skip, take: limit, orderBy: { createdAt: 'desc' },
      include: {
        user:     { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, status: true, createdAt: true } },
        services: { select: { serviceType: true, pricePerHour: true } },
        _count:   { select: { bookingsAsProvider: true } },
      },
    }),
    prisma.providerProfile.count({ where }),
  ]);

  return {
    items: items.map(p => ({
      id:           p.id,
      userId:       p.user.id,
      firstName:    p.user.firstName,
      lastName:     p.user.lastName,
      email:        p.user.email,
      phone:        p.user.phone,
      avatarUrl:    p.user.avatarUrl,
      status:       p.user.status,
      isVerified:   p.isVerified,
      isAvailable:  p.isAvailable,
      rating:       Number(p.rating),
      totalMissions: p._count.bookingsAsProvider,
      services:     p.services,
      createdAt:    p.user.createdAt,
    })),
    total,
  };
}

// ─── Transactions admin ───────────────────────────────────────────────────────

export async function listAllTransactions(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user:    { select: { id: true, firstName: true, lastName: true, email: true } },
        booking: { select: { id: true, serviceType: true } },
      },
    }),
    prisma.transaction.count(),
  ]);
  return { items, total };
}
