import { Request, Response, NextFunction } from 'express';
import { UserRole, UserStatus } from '@prisma/client';
import { firebaseAuth } from '../config/firebase';
import { prisma } from '../config/prisma';
import { AppError, ErrorCode } from '../utils/errors';

export interface AuthRequest extends Request {
  userId:     string;
  firebaseUid: string;
  userRole:   UserRole;
  userStatus: UserStatus;
}

/**
 * Vérifie le token Bearer Firebase, charge l'utilisateur depuis PostgreSQL
 * et bloque les comptes suspendus/bannis.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next(AppError.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, 'Token Bearer manquant'));
    }

    const token = header.slice(7);
    let decoded: { uid: string };
    try {
      decoded = await firebaseAuth().verifyIdToken(token);
    } catch {
      return next(AppError.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, 'Token invalide ou expiré'));
    }

    const user = await prisma.user.findUnique({
      where:  { firebaseUid: decoded.uid },
      select: { id: true, firebaseUid: true, role: true, status: true },
    });

    if (!user) {
      return next(AppError.unauthorized(ErrorCode.UNAUTHORIZED, 'Utilisateur non enregistré'));
    }

    if (user.status === UserStatus.SUSPENDED) {
      return next(AppError.forbidden(ErrorCode.AUTH_ACCOUNT_SUSPENDED, 'Compte suspendu'));
    }
    if (user.status === UserStatus.BANNED) {
      return next(AppError.forbidden(ErrorCode.AUTH_ACCOUNT_BANNED, 'Compte banni'));
    }

    const authReq      = req as AuthRequest;
    authReq.userId     = user.id;
    authReq.firebaseUid = user.firebaseUid!;
    authReq.userRole   = user.role;
    authReq.userStatus = user.status;

    next();
  } catch (err) {
    next(err);
  }
}
