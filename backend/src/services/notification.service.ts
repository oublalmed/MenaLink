import { prisma } from '../config/prisma';
import { firebaseMessaging, firebaseDB } from '../config/firebase';
import { BookingStatus, NotificationType } from '../../../shared/types';

const STATUS_MESSAGES: Record<BookingStatus, { title: string; body: string }> = {
  [BookingStatus.PENDING]: { title: 'Nouvelle réservation', body: 'Une réservation vous a été assignée.' },
  [BookingStatus.CONFIRMED]: { title: 'Réservation confirmée', body: 'Votre réservation a été confirmée.' },
  [BookingStatus.IN_PROGRESS]: { title: 'Prestation en cours', body: 'La prestation a démarré.' },
  [BookingStatus.COMPLETED]: { title: 'Prestation terminée', body: 'La prestation est terminée. Laissez un avis !' },
  [BookingStatus.CANCELLED]: { title: 'Réservation annulée', body: 'Votre réservation a été annulée.' },
  [BookingStatus.DISPUTED]: { title: 'Litige ouvert', body: 'Un litige a été ouvert sur votre réservation.' },
};

/**
 * Envoie une notification push et met à jour Firebase Realtime DB lors d'un changement de statut.
 */
export async function notifyBookingUpdate(bookingId: string, status: BookingStatus): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { select: { id: true, fcmToken: true } },
        provider: { include: { user: { select: { id: true, fcmToken: true } } } },
      },
    });

    if (!booking) return;

    const msg = STATUS_MESSAGES[status];
    const targetUser = status === BookingStatus.PENDING ? booking.provider.user : booking.client;

    // Mise à jour Firebase Realtime DB
    await firebaseDB()
      .ref(`bookings/${bookingId}`)
      .set({ bookingId, status, updatedAt: Date.now() });

    // Notification dans la base SQL
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: `BOOKING_${status}`,
        title: msg.title,
        body: msg.body,
        data: { bookingId },
      },
    });

    // Push notification FCM
    if (targetUser.fcmToken) {
      await firebaseMessaging().send({
        token: targetUser.fcmToken,
        notification: { title: msg.title, body: msg.body },
        data: { bookingId, status, type: NotificationType.BOOKING_NEW },
      });
    }
  } catch (err) {
    console.error('[notifyBookingUpdate] Erreur notification:', err);
  }
}
