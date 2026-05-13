import { BookingStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError, ErrorCode } from '../utils/errors';
import { sendPushNotification } from './notification.service';
import { firebaseDB } from '../config/firebase';
import type { z } from 'zod';
import type { createBookingSchema, bookingListQuerySchema } from '../schemas/booking.schemas';

type CreateDto = z.infer<typeof createBookingSchema>;
type ListQuery = z.infer<typeof bookingListQuerySchema>;

const COMMISSION_RATE = 0.15;

const bookingInclude = {
  address:  true,
  review:   { select: { id: true, rating: true, comment: true, createdAt: true } },
} as const;

// ─── Calcul de devis ──────────────────────────────────────────────────────────

export async function calculateQuote(
  providerId: string, serviceType: string, durationHours: number,
) {
  const providerProfile = await prisma.providerProfile.findUnique({ where: { id: providerId } });
  if (!providerProfile) throw AppError.notFound(ErrorCode.PROVIDER_NOT_FOUND, 'Prestataire introuvable');

  const providerService = await prisma.providerService.findFirst({
    where: { providerId, serviceType: serviceType as never },
  });
  if (!providerService) {
    throw AppError.badRequest(ErrorCode.PROVIDER_SERVICE_MISSING, 'Ce prestataire ne propose pas ce service');
  }

  const pricePerHour   = Number(providerService.pricePerHour);
  const totalAmount    = parseFloat((pricePerHour * durationHours).toFixed(2));
  const commission     = parseFloat((totalAmount * COMMISSION_RATE).toFixed(2));
  const providerAmount = parseFloat((totalAmount - commission).toFixed(2));

  return { pricePerHour, totalAmount, commission, providerAmount, durationHours };
}

// ─── Création réservation ─────────────────────────────────────────────────────

export async function createBooking(clientId: string, dto: CreateDto) {
  const [providerProfile, address] = await Promise.all([
    prisma.providerProfile.findUnique({
      where: { id: dto.providerId },
      include: { user: { select: { id: true, fcmToken: true, firstName: true } } },
    }),
    prisma.clientAddress.findUnique({ where: { id: dto.addressId, userId: clientId } }),
  ]);

  if (!providerProfile) throw AppError.notFound(ErrorCode.PROVIDER_NOT_FOUND, 'Prestataire introuvable');
  if (!providerProfile.isVerified) throw AppError.badRequest(ErrorCode.PROVIDER_NOT_VERIFIED, 'Prestataire non vérifié');
  if (!providerProfile.isAvailable) throw AppError.badRequest(ErrorCode.PROVIDER_NOT_AVAILABLE, 'Prestataire indisponible');
  if (!address) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Adresse introuvable');

  // Vérifier que le créneau est disponible
  const conflict = await prisma.booking.findFirst({
    where: {
      providerId:    providerProfile.user.id,
      scheduledDate: new Date(dto.scheduledDate),
      scheduledTime: dto.scheduledTime,
      status:        { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
    },
  });
  if (conflict) throw AppError.badRequest(ErrorCode.BOOKING_SLOT_UNAVAILABLE, 'Ce créneau est déjà réservé');

  const quote = await calculateQuote(dto.providerId, dto.serviceType, dto.durationHours);

  const booking = await prisma.booking.create({
    data: {
      clientId,
      providerId:    providerProfile.user.id,
      addressId:     dto.addressId,
      serviceType:   dto.serviceType,
      scheduledDate: new Date(dto.scheduledDate),
      scheduledTime: dto.scheduledTime,
      durationHours: dto.durationHours,
      totalAmount:   quote.totalAmount,
      commission:    quote.commission,
      providerAmount: quote.providerAmount,
      paymentMethod: dto.paymentMethod,
      clientNotes:   dto.clientNotes,
    },
    include: bookingInclude,
  });

  // Notif Firebase + push
  await syncFirebaseBooking(booking.id, BookingStatus.PENDING);
  await sendPushNotification(providerProfile.user.id, {
    title: 'Nouvelle réservation',
    body:  `Vous avez une nouvelle demande de mission.`,
    data:  { bookingId: booking.id, type: 'BOOKING_NEW' },
  });

  return booking;
}

// ─── Liste des réservations ───────────────────────────────────────────────────

export async function listBookings(userId: string, role: string, query: ListQuery) {
  const { page, limit, status, dateFrom, dateTo } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.BookingWhereInput = {
    ...(role === 'CLIENT'   && { clientId:   userId }),
    ...(role === 'PROVIDER' && { providerId: userId }),
    ...(status && { status }),
    ...(dateFrom && { scheduledDate: { gte: new Date(dateFrom) } }),
    ...(dateTo   && { scheduledDate: { lte: new Date(dateTo)   } }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      skip,
      take:     limit,
      orderBy:  { createdAt: 'desc' },
      include:  bookingInclude,
    }),
    prisma.booking.count({ where }),
  ]);

  return { items, total };
}

// ─── Détails d'une réservation ────────────────────────────────────────────────

export async function getBookingById(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where:   { id: bookingId },
    include: { address: true, review: true },
  });
  if (!booking) throw AppError.notFound(ErrorCode.BOOKING_NOT_FOUND, 'Réservation introuvable');

  const isOwner = booking.clientId === userId || booking.providerId === userId;
  if (!isOwner && role !== 'ADMIN') throw AppError.forbidden();

  return booking;
}

// ─── Transitions de statut ────────────────────────────────────────────────────

export async function confirmBooking(bookingId: string, providerId: string) {
  const booking = await assertProviderOwns(bookingId, providerId);
  assertStatus(booking.status, [BookingStatus.PENDING], 'confirmer');

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data:  { status: BookingStatus.CONFIRMED },
  });

  await syncFirebaseBooking(bookingId, BookingStatus.CONFIRMED);
  await sendPushNotification(booking.clientId, {
    title: 'Réservation confirmée',
    body:  'Votre prestataire a confirmé la mission.',
    data:  { bookingId, type: 'BOOKING_CONFIRMED' },
  });

  return updated;
}

export async function declineBooking(bookingId: string, providerId: string, reason: string) {
  const booking = await assertProviderOwns(bookingId, providerId);
  assertStatus(booking.status, [BookingStatus.PENDING], 'refuser');

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data:  { status: BookingStatus.CANCELLED, cancellationReason: reason },
  });

  await syncFirebaseBooking(bookingId, BookingStatus.CANCELLED);
  await sendPushNotification(booking.clientId, {
    title: 'Réservation refusée',
    body:  `Votre prestataire a refusé la mission : ${reason}`,
    data:  { bookingId, type: 'BOOKING_CANCELLED' },
  });

  return updated;
}

export async function startBooking(bookingId: string, providerId: string) {
  const booking = await assertProviderOwns(bookingId, providerId);
  assertStatus(booking.status, [BookingStatus.CONFIRMED], 'démarrer');

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data:  { status: BookingStatus.IN_PROGRESS, startedAt: new Date() },
  });

  await syncFirebaseBooking(bookingId, BookingStatus.IN_PROGRESS);
  await sendPushNotification(booking.clientId, {
    title: 'Mission démarrée',
    body:  'Votre prestataire a démarré la mission.',
    data:  { bookingId, type: 'BOOKING_STARTED' },
  });

  return updated;
}

export async function completeBooking(bookingId: string, providerId: string) {
  const booking = await assertProviderOwns(bookingId, providerId);
  assertStatus(booking.status, [BookingStatus.IN_PROGRESS], 'terminer');

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { id: bookingId },
      data:  { status: BookingStatus.COMPLETED, completedAt: new Date() },
    });

    // Crédit des gains si paiement cash (online géré par webhook YouCan Pay)
    if (b.paymentMethod === PaymentMethod.CASH) {
      const providerProfile = await tx.providerProfile.findFirst({ where: { userId: providerId } });
      if (providerProfile) {
        await tx.providerEarning.update({
          where: { providerId: providerProfile.id },
          data:  {
            availableBalance: { increment: b.providerAmount },
            totalEarned:      { increment: b.providerAmount },
          },
        });
      }
    }

    // Mise à jour compteur missions
    const pp = await tx.providerProfile.findFirst({ where: { userId: providerId } });
    if (pp) {
      await tx.providerProfile.update({
        where: { id: pp.id },
        data:  { totalMissions: { increment: 1 } },
      });
    }

    return b;
  });

  await syncFirebaseBooking(bookingId, BookingStatus.COMPLETED);
  await sendPushNotification(booking.clientId, {
    title: 'Mission terminée',
    body:  'La mission est terminée. N\'oubliez pas de laisser un avis !',
    data:  { bookingId, type: 'BOOKING_COMPLETED' },
  });

  return updated;
}

export async function cancelBooking(bookingId: string, clientId: string, reason: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw AppError.notFound(ErrorCode.BOOKING_NOT_FOUND, 'Réservation introuvable');
  if (booking.clientId !== clientId) throw AppError.forbidden();

  const cancelable = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
  if (!cancelable.includes(booking.status)) {
    throw AppError.badRequest(ErrorCode.BOOKING_CANNOT_CANCEL, 'Cette réservation ne peut plus être annulée');
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data:  { status: BookingStatus.CANCELLED, cancellationReason: reason },
  });

  await syncFirebaseBooking(bookingId, BookingStatus.CANCELLED);
  await sendPushNotification(booking.providerId, {
    title: 'Réservation annulée',
    body:  `Le client a annulé la mission : ${reason}`,
    data:  { bookingId, type: 'BOOKING_CANCELLED' },
  });

  // Remboursement si paiement en ligne déjà effectué
  if (booking.paymentMethod === PaymentMethod.ONLINE && booking.paymentStatus === PaymentStatus.PAID) {
    await prisma.booking.update({
      where: { id: bookingId },
      data:  { paymentStatus: PaymentStatus.REFUNDED },
    });
  }

  return updated;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertProviderOwns(bookingId: string, providerId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw AppError.notFound(ErrorCode.BOOKING_NOT_FOUND, 'Réservation introuvable');
  if (booking.providerId !== providerId) throw AppError.forbidden(ErrorCode.BOOKING_WRONG_PROVIDER, 'Vous n\'êtes pas le prestataire de cette réservation');
  return booking;
}

function assertStatus(current: BookingStatus, allowed: BookingStatus[], action: string): void {
  if (!allowed.includes(current)) {
    throw AppError.badRequest(
      ErrorCode.BOOKING_CANNOT_CANCEL,
      `Impossible de ${action} une réservation avec le statut "${current}"`,
    );
  }
}

async function syncFirebaseBooking(bookingId: string, status: BookingStatus): Promise<void> {
  try {
    await firebaseDB().ref(`bookings/${bookingId}`).set({ bookingId, status, updatedAt: Date.now() });
  } catch {
    // Non bloquant
  }
}
