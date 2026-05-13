import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendPaginated } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { BookingStatus, UserRole } from '../../../shared/types';
import { notifyBookingUpdate } from '../services/notification.service';

const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  providerId: z.string().uuid(),
  addressId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  durationHours: z.number().min(1).max(24),
  notes: z.string().max(500).optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  reason: z.string().optional(),
});

/**
 * Crée une nouvelle réservation.
 */
export async function createBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createBookingSchema.parse(req.body);

    const [service, provider] = await Promise.all([
      prisma.service.findUnique({ where: { id: data.serviceId, isActive: true } }),
      prisma.providerProfile.findUnique({ where: { id: data.providerId, isAvailable: true } }),
    ]);

    if (!service) throw new AppError(404, 'Service introuvable');
    if (!provider) throw new AppError(404, 'Prestataire indisponible');

    const totalPrice = Number(provider.pricePerHour) * data.durationHours;

    const booking = await prisma.booking.create({
      data: {
        clientId: req.userId!,
        providerId: data.providerId,
        serviceId: data.serviceId,
        addressId: data.addressId,
        scheduledAt: new Date(data.scheduledAt),
        durationHours: data.durationHours,
        totalPrice,
        notes: data.notes,
      },
      include: { service: true, address: true, provider: { include: { user: true } } },
    });

    await notifyBookingUpdate(booking.id, BookingStatus.PENDING);

    sendSuccess(res, booking, 201, 'Réservation créée');
  } catch (err) {
    next(err);
  }
}

/**
 * Retourne la liste des réservations de l'utilisateur (client ou prestataire).
 */
export async function getBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const where =
      req.userRole === UserRole.CLIENT
        ? { clientId: req.userId }
        : req.userRole === UserRole.PROVIDER
          ? { providerId: req.userId }
          : {};

    const [items, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { service: true, address: true, payment: true, review: true },
      }),
      prisma.booking.count({ where }),
    ]);

    sendPaginated(res, items, total, page, limit);
  } catch (err) {
    next(err);
  }
}

/**
 * Retourne une réservation par son identifiant.
 */
export async function getBookingById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        service: true,
        address: true,
        payment: true,
        review: true,
        provider: { include: { user: true } },
      },
    });

    if (!booking) throw new AppError(404, 'Réservation introuvable');

    const isOwner = booking.clientId === req.userId || booking.provider.userId === req.userId;
    if (!isOwner && req.userRole !== UserRole.ADMIN) throw new AppError(403, 'Accès interdit');

    sendSuccess(res, booking);
  } catch (err) {
    next(err);
  }
}

/**
 * Met à jour le statut d'une réservation.
 */
export async function updateBookingStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = updateStatusSchema.parse(req.body);

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
    });

    await notifyBookingUpdate(booking.id, status);

    sendSuccess(res, booking, 200, 'Statut mis à jour');
  } catch (err) {
    next(err);
  }
}

/**
 * Annule une réservation (client uniquement, si PENDING ou CONFIRMED).
 */
export async function cancelBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });

    if (!booking) throw new AppError(404, 'Réservation introuvable');
    if (booking.clientId !== req.userId) throw new AppError(403, 'Accès interdit');
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status as BookingStatus)) {
      throw new AppError(400, 'Impossible d\'annuler cette réservation');
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: BookingStatus.CANCELLED },
    });

    await notifyBookingUpdate(updated.id, BookingStatus.CANCELLED);

    sendSuccess(res, updated, 200, 'Réservation annulée');
  } catch (err) {
    next(err);
  }
}
