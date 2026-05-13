import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';

/** Retourne les notifications de l'utilisateur connecté. */
export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    sendSuccess(res, notifications);
  } catch (err) {
    next(err);
  }
}

/** Marque une notification comme lue. */
export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { isRead: true },
    });
    sendSuccess(res, null, 200);
  } catch (err) {
    next(err);
  }
}

/** Marque toutes les notifications comme lues. */
export async function markAllAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true },
    });
    sendSuccess(res, null, 200);
  } catch (err) {
    next(err);
  }
}
