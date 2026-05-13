import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';
import { prisma } from '../config/prisma';
import { UserRole } from '../../../shared/types';

export interface AuthRequest extends Request {
  userId?: string;
  firebaseUid?: string;
  userRole?: UserRole;
}

/**
 * Vérifie le token Firebase Bearer et charge l'utilisateur en base.
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Token manquant' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = await firebaseAuth().verifyIdToken(token);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, firebaseUid: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Utilisateur introuvable ou inactif' });
      return;
    }

    req.userId = user.id;
    req.firebaseUid = user.firebaseUid;
    req.userRole = user.role as UserRole;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
}

/**
 * Restreint l'accès à certains rôles.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ success: false, message: 'Accès interdit' });
      return;
    }
    next();
  };
}
