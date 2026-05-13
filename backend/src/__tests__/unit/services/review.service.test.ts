import { BookingStatus } from '@prisma/client';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    booking:        { findUnique: jest.fn() },
    review:         { create: jest.fn(), aggregate: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    providerProfile: { findFirst: jest.fn(), update: jest.fn() },
    $transaction:   jest.fn(),
  },
}));

import { prisma } from '../../../config/prisma';
import { createReview, deleteReview } from '../../../services/review.service';

const mp = prisma as jest.Mocked<typeof prisma>;

const mockCompletedBooking = {
  id: 'b1', clientId: 'c1', providerId: 'p1',
  status: BookingStatus.COMPLETED, review: null,
};

beforeEach(() => jest.clearAllMocks());

describe('createReview', () => {
  it('crée un avis avec succès', async () => {
    (mp.booking.findUnique as jest.Mock).mockResolvedValue(mockCompletedBooking);
    const reviewResult = { id: 'r1', bookingId: 'b1', clientId: 'c1', providerId: 'p1', rating: 5 };
    (mp.$transaction as jest.Mock).mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        review: {
          create:    jest.fn().mockResolvedValue(reviewResult),
          aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 5 }, _count: { rating: 1 } }),
        },
        providerProfile: { findFirst: jest.fn().mockResolvedValue({ id: 'pp1' }), update: jest.fn() },
      };
      return fn(tx);
    });

    const review = await createReview('c1', { bookingId: 'b1', rating: 5, comment: 'Super !' });
    expect(review.rating).toBe(5);
  });

  it('lève REVIEW_ALREADY_EXISTS', async () => {
    (mp.booking.findUnique as jest.Mock).mockResolvedValue({
      ...mockCompletedBooking, review: { id: 'existing-review' },
    });

    await expect(createReview('c1', { bookingId: 'b1', rating: 4 })).rejects.toMatchObject({
      code: 'REVIEW_ALREADY_EXISTS',
    });
  });

  it('lève REVIEW_MISSION_INCOMPLETE si statut != COMPLETED', async () => {
    (mp.booking.findUnique as jest.Mock).mockResolvedValue({
      ...mockCompletedBooking, status: BookingStatus.IN_PROGRESS, review: null,
    });

    await expect(createReview('c1', { bookingId: 'b1', rating: 3 })).rejects.toMatchObject({
      code: 'REVIEW_MISSION_INCOMPLETE',
    });
  });

  it('lève FORBIDDEN si pas le client', async () => {
    (mp.booking.findUnique as jest.Mock).mockResolvedValue(mockCompletedBooking);

    await expect(createReview('autre-client', { bookingId: 'b1', rating: 3 })).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

describe('deleteReview', () => {
  it('lève NOT_FOUND si avis inexistant', async () => {
    (mp.review.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(deleteReview('bad-id')).rejects.toMatchObject({ code: 'REVIEW_NOT_FOUND' });
  });
});
