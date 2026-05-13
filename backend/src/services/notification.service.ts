import { prisma } from '../config/prisma';
import { firebaseMessaging } from '../config/firebase';
import { AppError, ErrorCode } from '../utils/errors';

interface PushPayload {
  title: string;
  body:  string;
  data?: Record<string, string>;
}

/**
 * Envoie une notification push FCM et la persiste en base.
 * Non bloquant : les erreurs FCM sont loggées sans faire échouer l'appelant.
 */
export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  try {
    // Persiste la notification
    await prisma.notification.create({
      data: {
        userId,
        title:  payload.title,
        body:   payload.body,
        type:   payload.data?.type ?? 'GENERIC',
        data:   (payload.data ?? null) as never,
        isRead: false,
      },
    });

    // Récupère le token FCM
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { fcmToken: true },
    });

    if (user?.fcmToken) {
      await firebaseMessaging().send({
        token:        user.fcmToken,
        notification: { title: payload.title, body: payload.body },
        data:         payload.data,
        android: { priority: 'high' },
        apns:    { payload: { aps: { sound: 'default' } } },
      });
    }
  } catch (err) {
    console.warn('[sendPushNotification] Non-fatal:', err);
  }
}

/** Liste des notifications d'un utilisateur. */
export async function getNotifications(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where:   { userId },
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId } }),
  ]);
  return { items, total };
}

/** Marque une notification comme lue. */
export async function markAsRead(notifId: string, userId: string): Promise<void> {
  const updated = await prisma.notification.updateMany({
    where: { id: notifId, userId },
    data:  { isRead: true },
  });
  if (updated.count === 0) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Notification introuvable');
}

/** Marque toutes les notifications comme lues. */
export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data:  { isRead: true },
  });
}
