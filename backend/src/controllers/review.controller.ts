import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { BookingStatus } from '../../../shared/types';

const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

/**
 * Crée un avis après une prestation terminée.
 */
export async function createReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createReviewSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { review: true },
    });

    if (!booking) throw new AppError(404, 'Réservation introuvable');
    if (booking.clientId !== req.userId) throw new AppError(403, 'Accès interdit');
    if (booking.status !== BookingStatus.COMPLETED) throw new AppError(400, 'La prestation n\'est pas encore terminée');
    if (booking.review) throw new AppError(409, 'Avis déjà soumis');

    const review = await prisma.review.create({
      data: {
        bookingId: data.bookingId,
        clientId: req.userId!,
        providerId: booking.providerId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    // Recalcule la note moyenne du prestataire
    const { _avg, _count } = await prisma.review.aggregate({
      where: { providerId: booking.providerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.providerProfile.update({
      where: { id: booking.providerId },
      data: {
        rating: _avg.rating ?? 0,
        reviewCount: _count.rating,
      },
    });

    sendSuccess(res, review, 201, 'Avis soumis');
  } catch (err) {
    next(err);
  }
}

/** Retourne les avis d'un prestataire. */
export async function getProviderReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reviews = await prisma.review.findMany({
      where: { providerId: req.params.providerId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { firstName: true, lastName: true, avatar: true } },
      },
    });
    sendSuccess(res, reviews);
  } catch (err) {
    next(err);
  }
}
