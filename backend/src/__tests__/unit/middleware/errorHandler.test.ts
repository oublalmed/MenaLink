import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../middleware/errorHandler';
import { AppError, ErrorCode } from '../../../utils/errors';
import { ZodError, z } from 'zod';
import { Prisma } from '@prisma/client';

function mockRes() {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
  return res;
}

describe('errorHandler', () => {
  const req  = {} as Request;
  const next = jest.fn() as NextFunction;

  it('gère AppError', () => {
    const err = AppError.notFound(ErrorCode.BOOKING_NOT_FOUND, 'Non trouvé');
    const res = mockRes();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({ code: 'BOOKING_NOT_FOUND' }),
    }));
  });

  it('gère ZodError', () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });
    const err    = (result as { error: ZodError }).error;
    const res    = mockRes();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('gère P2002 (contrainte unique Prisma)', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code:     'P2002',
      clientVersion: '5.0.0',
      meta:     { target: ['email'] },
    });
    const res = mockRes();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('gère P2025 (enregistrement introuvable)', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Not found', {
      code:          'P2025',
      clientVersion: '5.0.0',
    });
    const res = mockRes();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('gère les erreurs inconnues avec 500', () => {
    const err = new Error('Erreur inattendue');
    const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });
});
