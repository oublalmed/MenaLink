import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery } from '../../../middleware/validate';

const schema = z.object({ name: z.string().min(2), age: z.number().int().positive() });

function mockReq(body = {}, query = {}): Request {
  return { body, query } as unknown as Request;
}
function mockRes(): Response {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
}

describe('validateBody', () => {
  it('appelle next() avec des données valides', () => {
    const req  = mockReq({ name: 'Ali', age: 25 });
    const next = jest.fn();
    validateBody(schema)(req, mockRes(), next as NextFunction);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Ali', age: 25 });
  });

  it('appelle next(err) avec des données invalides', () => {
    const req  = mockReq({ name: 'A', age: -1 });
    const next = jest.fn();
    validateBody(schema)(req, mockRes(), next as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 422 }));
  });

  it('transforme les données (coerce, default)', () => {
    const s   = z.object({ page: z.coerce.number().default(1) });
    const req = mockReq({ page: '3' });
    const next = jest.fn();
    validateBody(s)(req, mockRes(), next as NextFunction);
    expect(req.body.page).toBe(3);
  });
});

describe('validateQuery', () => {
  it('injecte validatedQuery', () => {
    const s   = z.object({ limit: z.coerce.number().default(10) });
    const req = mockReq({}, { limit: '5' }) as Request & { validatedQuery: unknown };
    const next = jest.fn();
    validateQuery(s)(req, mockRes(), next as NextFunction);
    expect(next).toHaveBeenCalledWith();
    expect(req.validatedQuery).toEqual({ limit: 5 });
  });

  it('appelle next(err) sur query invalide', () => {
    const s   = z.object({ page: z.coerce.number().positive() });
    const req = mockReq({}, { page: '-1' });
    const next = jest.fn();
    validateQuery(s)(req, mockRes(), next as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 422 }));
  });
});
