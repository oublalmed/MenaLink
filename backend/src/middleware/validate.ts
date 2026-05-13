import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError, ErrorCode } from '../utils/errors';

/**
 * Valide `req.body` avec le schéma Zod fourni.
 * En cas d'erreur, répond avec les détails de validation.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = formatZodErrors(result.error);
      return next(
        new AppError(422, ErrorCode.VALIDATION_ERROR, 'Données invalides', details),
      );
    }
    req.body = result.data;
    next();
  };
}

/**
 * Valide `req.query` avec le schéma Zod fourni.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = formatZodErrors(result.error);
      return next(
        new AppError(422, ErrorCode.VALIDATION_ERROR, 'Paramètres de requête invalides', details),
      );
    }
    (req as Request & { validatedQuery: T }).validatedQuery = result.data;
    next();
  };
}

function formatZodErrors(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((e) => ({
    field:   e.path.join('.'),
    message: e.message,
  }));
}
