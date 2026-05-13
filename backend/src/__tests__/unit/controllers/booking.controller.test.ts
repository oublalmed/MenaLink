import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middleware/authenticate';
import { UserRole, UserStatus } from '@prisma/client';

jest.mock('../../../services/booking.service', () => ({
  createBooking:   jest.fn(),
  listBookings:    jest.fn(),
  getBookingById:  jest.fn(),
  confirmBooking:  jest.fn(),
  cancelBooking:   jest.fn(),
  calculateQuote:  jest.fn(),
}));

import * as bookingService from '../../../services/booking.service';
import {
  createBooking, listBookings, getBooking, confirmBooking, cancelBooking, getQuote,
} from '../../../controllers/booking.controller';

function authReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    userId:     'user-1',
    firebaseUid: 'fb-1',
    userRole:   UserRole.CLIENT,
    userStatus: UserStatus.ACTIVE,
    body:       {},
    params:     {},
    query:      {},
    pagination: { page: 1, limit: 10, skip: 0 },
    validatedQuery: { page: 1, limit: 10 },
    ...overrides,
  } as unknown as AuthRequest;
}

function mockRes(): Response {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
}

const next: NextFunction = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('createBooking controller', () => {
  it('retourne 201 en cas de succès', async () => {
    const booking = { id: 'b1', status: 'PENDING' };
    (bookingService.createBooking as jest.Mock).mockResolvedValue(booking);

    const req = authReq({ body: { providerId: 'pp1' } });
    const res = mockRes();
    await createBooking(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('appelle next(err) en cas d\'erreur service', async () => {
    const err = new Error('Service error');
    (bookingService.createBooking as jest.Mock).mockRejectedValue(err);

    await createBooking(authReq(), mockRes(), next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('listBookings controller', () => {
  it('retourne une liste paginée', async () => {
    (bookingService.listBookings as jest.Mock).mockResolvedValue({
      items: [{ id: 'b1' }], total: 1,
    });

    const res = mockRes();
    await listBookings(authReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('confirmBooking controller', () => {
  it('confirme et retourne 200', async () => {
    (bookingService.confirmBooking as jest.Mock).mockResolvedValue({ id: 'b1', status: 'CONFIRMED' });

    const req = authReq({ params: { id: 'b1' } as never, userRole: UserRole.PROVIDER });
    const res = mockRes();
    await confirmBooking(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('getQuote controller', () => {
  it('retourne le devis', async () => {
    (bookingService.calculateQuote as jest.Mock).mockResolvedValue({ totalAmount: 240 });

    const req = authReq({ validatedQuery: { providerId: 'pp1', serviceType: 'CLEANING', durationHours: 3 } });
    const res = mockRes();
    await getQuote(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { totalAmount: 240 } }));
  });
});
