import { BookingStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    providerProfile: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    clientAddress:   { findUnique: jest.fn() },
    providerService: { findFirst: jest.fn() },
    booking: {
      create:     jest.fn(),
      findUnique: jest.fn(),
      findFirst:  jest.fn(),
      update:     jest.fn(),
      count:      jest.fn(),
      findMany:   jest.fn(),
    },
    providerEarning: { update: jest.fn() },
    $transaction:    jest.fn(),
  },
}));

jest.mock('../../../config/firebase', () => ({
  firebaseDB: jest.fn().mockReturnValue({
    ref: jest.fn().mockReturnValue({ set: jest.fn().mockResolvedValue(undefined) }),
  }),
}));

jest.mock('../../../services/notification.service', () => ({
  sendPushNotification: jest.fn().mockResolvedValue(undefined),
}));

import { prisma } from '../../../config/prisma';
import {
  calculateQuote, createBooking, confirmBooking,
  cancelBooking, declineBooking,
} from '../../../services/booking.service';

const mp = prisma as jest.Mocked<typeof prisma>;

const mockProvider = {
  id: 'pp-1', userId: 'provider-1', isVerified: true, isAvailable: true,
  user: { id: 'provider-1', fcmToken: 'tok', firstName: 'Khadija' },
};
const mockAddress  = { id: 'addr-1', userId: 'client-1' };
const mockService  = { pricePerHour: 80 };
const mockBooking  = {
  id: 'book-1', clientId: 'client-1', providerId: 'provider-1',
  addressId: 'addr-1', serviceType: 'CLEANING', status: BookingStatus.PENDING,
  totalAmount: 240, commission: 36, providerAmount: 204,
  paymentMethod: PaymentMethod.CASH, paymentStatus: PaymentStatus.PENDING,
  scheduledDate: new Date(), scheduledTime: '09:00', durationHours: 3,
  clientNotes: null, cancellationReason: null,
  startedAt: null, completedAt: null, createdAt: new Date(), updatedAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

describe('calculateQuote', () => {
  it('calcule le devis correctement', async () => {
    (mp.providerProfile.findUnique as jest.Mock).mockResolvedValue(mockProvider);
    (mp.providerService.findFirst as jest.Mock).mockResolvedValue(mockService);

    const quote = await calculateQuote('pp-1', 'CLEANING', 3);
    expect(quote.totalAmount).toBe(240);
    expect(quote.commission).toBeCloseTo(36, 1);
    expect(quote.providerAmount).toBeCloseTo(204, 1);
  });

  it('lève PROVIDER_NOT_FOUND si prestataire introuvable', async () => {
    (mp.providerProfile.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(calculateQuote('bad', 'CLEANING', 2)).rejects.toMatchObject({
      code: 'PROVIDER_NOT_FOUND',
    });
  });

  it('lève PROVIDER_SERVICE_MISSING si service non proposé', async () => {
    (mp.providerProfile.findUnique as jest.Mock).mockResolvedValue(mockProvider);
    (mp.providerService.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(calculateQuote('pp-1', 'COOKING', 2)).rejects.toMatchObject({
      code: 'PROVIDER_SERVICE_MISSING',
    });
  });
});

describe('createBooking', () => {
  it('crée une réservation avec succès', async () => {
    (mp.providerProfile.findUnique as jest.Mock).mockResolvedValue(mockProvider);
    (mp.clientAddress.findUnique as jest.Mock).mockResolvedValue(mockAddress);
    (mp.providerService.findFirst as jest.Mock).mockResolvedValue(mockService);
    (mp.booking.findFirst as jest.Mock).mockResolvedValue(null); // pas de conflit
    (mp.booking.create as jest.Mock).mockResolvedValue(mockBooking);

    const result = await createBooking('client-1', {
      providerId: 'pp-1', addressId: 'addr-1', serviceType: 'CLEANING' as never,
      scheduledDate: '2025-12-01', scheduledTime: '09:00',
      durationHours: 3, paymentMethod: PaymentMethod.CASH,
    });

    expect(result.id).toBe('book-1');
  });

  it('lève BOOKING_SLOT_UNAVAILABLE si créneau occupé', async () => {
    (mp.providerProfile.findUnique as jest.Mock).mockResolvedValue(mockProvider);
    (mp.clientAddress.findUnique as jest.Mock).mockResolvedValue(mockAddress);
    (mp.providerService.findFirst as jest.Mock).mockResolvedValue(mockService);
    (mp.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking); // conflit !

    await expect(
      createBooking('client-1', {
        providerId: 'pp-1', addressId: 'addr-1', serviceType: 'CLEANING' as never,
        scheduledDate: '2025-12-01', scheduledTime: '09:00',
        durationHours: 3, paymentMethod: PaymentMethod.CASH,
      }),
    ).rejects.toMatchObject({ code: 'BOOKING_SLOT_UNAVAILABLE' });
  });

  it('lève PROVIDER_NOT_VERIFIED si non vérifié', async () => {
    (mp.providerProfile.findUnique as jest.Mock).mockResolvedValue({ ...mockProvider, isVerified: false });
    (mp.clientAddress.findUnique as jest.Mock).mockResolvedValue(mockAddress);

    await expect(
      createBooking('client-1', {
        providerId: 'pp-1', addressId: 'addr-1', serviceType: 'CLEANING' as never,
        scheduledDate: '2025-12-01', scheduledTime: '09:00',
        durationHours: 3, paymentMethod: PaymentMethod.CASH,
      }),
    ).rejects.toMatchObject({ code: 'PROVIDER_NOT_VERIFIED' });
  });
});

describe('cancelBooking', () => {
  it('annule avec succès (statut PENDING)', async () => {
    (mp.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
    (mp.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED });

    const result = await cancelBooking('book-1', 'client-1', 'Imprévu');
    expect(result.status).toBe(BookingStatus.CANCELLED);
  });

  it('lève BOOKING_CANNOT_CANCEL si déjà terminée', async () => {
    (mp.booking.findUnique as jest.Mock).mockResolvedValue({
      ...mockBooking, status: BookingStatus.COMPLETED,
    });

    await expect(cancelBooking('book-1', 'client-1', 'Raison')).rejects.toMatchObject({
      code: 'BOOKING_CANNOT_CANCEL',
    });
  });

  it('lève FORBIDDEN si pas le client', async () => {
    (mp.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
    await expect(cancelBooking('book-1', 'autre-client', 'Raison')).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

describe('confirmBooking', () => {
  it('confirme avec succès', async () => {
    (mp.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
    (mp.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, status: BookingStatus.CONFIRMED });

    const result = await confirmBooking('book-1', 'provider-1');
    expect(result.status).toBe(BookingStatus.CONFIRMED);
  });

  it('lève une erreur si statut n\'est pas PENDING', async () => {
    (mp.booking.findUnique as jest.Mock).mockResolvedValue({
      ...mockBooking, status: BookingStatus.COMPLETED,
    });

    await expect(confirmBooking('book-1', 'provider-1')).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
