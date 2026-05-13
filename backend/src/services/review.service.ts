import { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError, ErrorCode } from '../utils/errors';
import type { z } from 'zod';
import type { createReviewSchema, reviewQuerySchema } from '../schemas/review.schemas';

type CreateDto = z.infer<typeof createReviewSchema>;
type ListQuery = z.infer<typeof reviewQuerySchema>;

/** Crée un avis après une prestation terminée. */
export async function createReview(clientId: string, dto: CreateDto) {
  const booking = await prisma.booking.findUnique({
    where:   { id: dto.bookingId },
    include: { review: { select: { id: true } } },
  });

  if (!booking) throw AppError.notFound(ErrorCode.BOOKING_NOT_FOUND, 'Réservation introuvable');
  if (booking.clientId !== clientId) throw AppError.forbidden();
  if (booking.status !== BookingStatus.COMPLETED) {
    throw AppError.badRequest(ErrorCode.REVIEW_MISSION_INCOMPLETE, 'La prestation doit être terminée pour laisser un avis');
  }
  if (booking.review) {
    throw AppError.conflict(ErrorCode.REVIEW_ALREADY_EXISTS, 'Vous avez déjà soumis un avis pour cette réservation');
  }

  const review = await prisma.$transaction(async (tx) => {
    const r = await tx.review.create({
      data: {
        bookingId:  dto.bookingId,
        clientId,
        providerId: booking.providerId,
        rating:     dto.rating,
        comment:    dto.comment,
      },
    });

    // Recalcul note moyenne
    const { _avg, _count } = await tx.review.aggregate({
      where:  { providerId: booking.providerId, isPublished: true },
      _avg:   { rating: true },
      _count: { rating: true },
    });

    const pp = await tx.providerProfile.findFirst({ where: { userId: booking.providerId } });
    if (pp) {
      await tx.providerProfile.update({
        where: { id: pp.id },
        data:  {
          averageRating: parseFloat((_avg.rating ?? 0).toFixed(2)),
          totalReviews:  _count.rating,
        },
      });
    }

    return r;
  });

  return review;
}

/** Avis d'un prestataire. */
export async function getProviderReviews(providerId: string, query: ListQuery) {
  const profile = await prisma.providerProfile.findUnique({ where: { id: providerId } });
  if (!profile) throw AppError.notFound(ErrorCode.PROVIDER_NOT_FOUND, 'Prestataire introuvable');

  const skip = (query.page - 1) * query.limit;

  const orderBy: Prisma.ReviewOrderByWithRelationInput =
    query.sort === 'rating_asc'  ? { rating: 'asc' }  :
    query.sort === 'rating_desc' ? { rating: 'desc' } :
    { createdAt: 'desc' };

  const [items, total] = await prisma.$transaction([
    prisma.review.findMany({
      where:   { providerId: profile.userId, isPublished: true },
      skip,
      take:    query.limit,
      orderBy,
      include: { client: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    }),
    prisma.review.count({ where: { providerId: profile.userId, isPublished: true } }),
  ]);

  return { items, total };
}

/** Supprime un avis (admin) et recalcule la note. */
export async function deleteReview(reviewId: string): Promise<void> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw AppError.notFound(ErrorCode.REVIEW_NOT_FOUND, 'Avis introuvable');

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: reviewId } });

    const { _avg, _count } = await tx.review.aggregate({
      where: { providerId: review.providerId, isPublished: true },
      _avg:  { rating: true },
      _count: { rating: true },
    });

    const pp = await tx.providerProfile.findFirst({ where: { userId: review.providerId } });
    if (pp) {
      await tx.providerProfile.update({
        where: { id: pp.id },
        data:  {
          averageRating: parseFloat((_avg.rating ?? 0).toFixed(2)),
          totalReviews:  _count.rating,
        },
      });
    }
  });
}
