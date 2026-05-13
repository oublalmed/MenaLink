import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError, ErrorCode } from '../utils/errors';

/** Middleware global de gestion des erreurs — doit être enregistré en dernier. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Erreur métier applicative
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code:    err.code,
        message: err.message,
        details: err.details ?? [],
      },
    });
    return;
  }

  // Erreur de validation Zod non interceptée par le middleware validate
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code:    ErrorCode.VALIDATION_ERROR,
        message: 'Données invalides',
        details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
    });
    return;
  }

  // Contrainte unique Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') ?? 'champ';
      res.status(409).json({
        success: false,
        error: { code: ErrorCode.CONFLICT, message: `Valeur déjà utilisée : ${field}`, details: [] },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: { code: ErrorCode.NOT_FOUND, message: 'Enregistrement introuvable', details: [] },
      });
      return;
    }
  }

  // Erreur inattendue
  const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
  console.error('[Erreur non gérée]', err);
  res.status(500).json({
    success: false,
    error: { code: ErrorCode.SERVER_ERROR, message, details: [] },
  });
}
