import { Request, Response, NextFunction } from 'express';
import * as notifService from '../services/notification.service';
import { ok, paginated, buildPagination } from '../utils/response';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.pagination;
    const { items, total } = await notifService.getNotifications(req.userId, page, limit);
    paginated(res, items, buildPagination(total, page, limit));
  } catch (err) { next(err); }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notifService.markAsRead(req.params.id, req.userId);
    ok(res, null, 'Notification marquée comme lue');
  } catch (err) { next(err); }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notifService.markAllAsRead(req.userId);
    ok(res, null, 'Toutes les notifications ont été lues');
  } catch (err) { next(err); }
}
