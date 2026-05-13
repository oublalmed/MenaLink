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
  const now      = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [
    totalUsers, totalProviders, totalClients,
    totalBookings, completedBookings, pendingBookings,
    totalRevenue, monthRevenue,
    pendingVerification, openDisputes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'PROVIDER' } }),
    prisma.user.count({ where: { role: 'CLIENT'   } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
    prisma.booking.count({ where: { status: BookingStatus.PENDING   } }),
    prisma.transaction.aggregate({ where: { type: 'COMMISSION', status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({
      where: { type: 'COMMISSION', status: 'SUCCESS', createdAt: { gte: monthAgo } },
      _sum: { amount: true },
    }),
    prisma.providerProfile.count({ where: { isVerified: false } }),
    prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
  ]);

  const conversionRate = totalBookings > 0
    ? parseFloat(((completedBookings / totalBookings) * 100).toFixed(1))
    : 0;

  return {
    users: { total: totalUsers, providers: totalProviders, clients: totalClients },
    bookings: { total: totalBookings, completed: completedBookings, pending: pendingBookings, conversionRate },
    revenue: {
      total:     parseFloat((Number(totalRevenue._sum.amount) ?? 0).toFixed(2)),
      thisMonth: parseFloat((Number(monthRevenue._sum.amount) ?? 0).toFixed(2)),
    },
    pendingVerification,
    openDisputes,
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
