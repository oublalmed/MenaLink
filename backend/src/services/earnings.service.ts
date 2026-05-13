import { WithdrawalStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError, ErrorCode } from '../utils/errors';
import type { z } from 'zod';
import type { withdrawSchema, earningsPeriodSchema } from '../schemas/earnings.schemas';

type WithdrawDto = z.infer<typeof withdrawSchema>;
type PeriodDto   = z.infer<typeof earningsPeriodSchema>;

/** Résumé des gains sur une période. */
export async function getEarningsSummary(userId: string, query: PeriodDto) {
  const profile = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!profile) throw AppError.notFound(ErrorCode.PROVIDER_NOT_FOUND, 'Profil prestataire introuvable');

  const earnings = await prisma.providerEarning.findUnique({ where: { providerId: profile.id } });

  const now      = new Date();
  const periods  = getPeriodBounds(query.period, now);

  const periodTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      type:      TransactionType.COMMISSION,
      status:    TransactionStatus.SUCCESS,
      createdAt: { gte: periods.start, lte: periods.end },
    },
  });

  const periodAmount = periodTransactions.reduce(
    (sum, t) => sum + Number(t.amount), 0,
  );

  return {
    availableBalance: Number(earnings?.availableBalance ?? 0),
    pendingBalance:   Number(earnings?.pendingBalance   ?? 0),
    totalEarned:      Number(earnings?.totalEarned      ?? 0),
    totalWithdrawn:   Number(earnings?.totalWithdrawn   ?? 0),
    periodLabel:      query.period,
    periodAmount:     parseFloat(periodAmount.toFixed(2)),
    periodStart:      periods.start,
    periodEnd:        periods.end,
  };
}

/** Historique détaillé des transactions du prestataire. */
export async function getEarningsTransactions(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where:   { userId },
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: { booking: { select: { id: true, serviceType: true, scheduledDate: true } } },
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);
  return { items, total };
}

/** Demande de virement. */
export async function requestWithdrawal(userId: string, dto: WithdrawDto) {
  const profile = await prisma.providerProfile.findUnique({
    where:   { userId },
    include: { earnings: true },
  });
  if (!profile) throw AppError.notFound(ErrorCode.PROVIDER_NOT_FOUND, 'Profil prestataire introuvable');

  const available = Number(profile.earnings?.availableBalance ?? 0);
  const minAmount = 100;

  if (dto.amount < minAmount) {
    throw AppError.badRequest(ErrorCode.INSUFFICIENT_BALANCE, `Montant minimum de retrait : ${minAmount} MAD`);
  }
  if (dto.amount > available) {
    throw AppError.badRequest(ErrorCode.INSUFFICIENT_BALANCE, `Solde insuffisant (disponible : ${available} MAD)`);
  }

  // Crée la demande et déduit le solde disponible
  const [withdrawal] = await prisma.$transaction([
    prisma.withdrawalRequest.create({
      data: {
        providerId:     profile.id,
        amount:         dto.amount,
        bankAccountRib: dto.bankAccountRib,
      },
    }),
    prisma.providerEarning.update({
      where: { providerId: profile.id },
      data:  { availableBalance: { decrement: dto.amount } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type:     TransactionType.WITHDRAWAL,
        amount:   dto.amount,
        currency: 'MAD',
        status:   TransactionStatus.PENDING,
      },
    }),
  ]);

  return withdrawal;
}

/** Liste des demandes de virement. */
export async function listWithdrawals(userId: string, page: number, limit: number) {
  const profile = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!profile) throw AppError.notFound(ErrorCode.PROVIDER_NOT_FOUND, 'Profil prestataire introuvable');

  const skip = (page - 1) * limit;
  const [items, total] = await prisma.$transaction([
    prisma.withdrawalRequest.findMany({
      where:   { providerId: profile.id },
      skip,
      take:    limit,
      orderBy: { requestedAt: 'desc' },
    }),
    prisma.withdrawalRequest.count({ where: { providerId: profile.id } }),
  ]);
  return { items, total };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodBounds(period: string, now: Date): { start: Date; end: Date } {
  const start = new Date(now);
  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }
  return { start, end: now };
}
