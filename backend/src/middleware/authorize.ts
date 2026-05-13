import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from './authenticate';
import { AppError } from '../utils/errors';

/**
 * Restreint l'accès à une liste de rôles.
 * Doit être utilisé après `authenticate`.
 */
export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!roles.includes(req.userRole)) {
      return next(AppError.forbidden(undefined, `Rôle requis : ${roles.join(' ou ')}`));
    }
    next();
  };
}
