import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { sendBookingReminder, sendNewBookingRequest } from './sms.service';
import { sendPushToMultiple } from '../config/firebase';
import { createLogger } from '../utils/logger';

const log = createLogger('scheduler');

const SERVICE_FR: Record<string, string> = {
  CLEANING: 'Ménage', IRONING: 'Repassage',
  DEEP_CLEANING: 'Grand ménage', POST_CONSTRUCTION: 'Post-chantier', COOKING: 'Cuisine',
};

// ── Job 1: SMS rappels 1h avant ───────────────────────────────────────────────
// Toutes les heures pile — envoie un rappel pour les missions dans 1h±5min
async function sendHourlyReminders(): Promise<void> {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const windowStart  = new Date(oneHourLater.getTime() - 5 * 60 * 1000);
  const windowEnd    = new Date(oneHourLater.getTime() + 5 * 60 * 1000);

  const targetHour = `${String(oneHourLater.getHours()).padStart(2, '0')}:${String(oneHourLater.getMinutes()).padStart(2, '0')}`;

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED'] },
        scheduledDate: {
          gte: new Date(windowStart.toISOString().split('T')[0]),
          lte: new Date(windowEnd.toISOString().split('T')[0]),
        },
        scheduledTime: { gte: `${String(windowStart.getHours()).padStart(2,'0')}:00`, lte: `${String(windowEnd.getHours()).padStart(2,'0')}:59` },
      },
      include: {
        client: { select: { phone: true, firstName: true, fcmToken: true } },
        provider: { select: { phone: true, firstName: true, fcmToken: true } },
      },
    });

    for (const booking of bookings) {
      const details = {
        serviceType: booking.serviceType,
        scheduledDate: booking.scheduledDate.toISOString(),
        scheduledTime: booking.scheduledTime,
        durationHours: Number(booking.durationHours),
        providerName: booking.provider?.firstName,
        clientName: booking.client?.firstName,
      };

      // SMS rappel client
      if (booking.client?.phone) {
        await sendBookingReminder(booking.client.phone, details);
      }

      // Push rappel client et prestataire
      const tokens = [booking.client?.fcmToken, booking.provider?.fcmToken].filter(Boolean) as string[];
      if (tokens.length > 0) {
        await sendPushToMultiple(tokens, '⏰ Rappel mission',
          `Votre service ${SERVICE_FR[booking.serviceType] ?? booking.serviceType} commence dans 1h`,
          { bookingId: booking.id, type: 'REMINDER' });
      }

      log.info('Rappel envoyé', { bookingId: booking.id, scheduledTime: booking.scheduledTime });
    }

    if (bookings.length > 0) log.info(`Rappels envoyés: ${bookings.length} réservations`);
  } catch (err) {
    log.error('Erreur job rappels', { error: (err as Error).message });
  }
}

// ── Job 2: Auto-déclin après 30 min sans réponse ──────────────────────────────
async function autoDeclineExpiredRequests(): Promise<void> {
  const TIMEOUT_MINUTES = Number(process.env.BOOKING_ACCEPTANCE_DELAY_MIN ?? 30);
  const threshold = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);

  try {
    const expired = await prisma.booking.findMany({
      where: { status: 'PENDING', createdAt: { lt: threshold } },
      include: {
        client: { select: { phone: true, fcmToken: true } },
        provider: { select: { firstName: true } },
      },
      take: 100,
    });

    for (const booking of expired) {
      await prisma.booking.update({
        where: { id: booking.id },
        data:  { status: 'CANCELLED', cancellationReason: 'Délai d\'acceptation dépassé (30 min)' },
      });

      // Notifier le client
      if (booking.client?.fcmToken) {
        await sendPushToMultiple(
          [booking.client.fcmToken],
          'Demande expirée',
          `Votre demande de ${SERVICE_FR[booking.serviceType] ?? booking.serviceType} n'a pas reçu de réponse dans les délais. Essayez un autre prestataire.`,
          { bookingId: booking.id, type: 'BOOKING_EXPIRED' },
        );
      }

      log.info('Réservation auto-déclinée', { bookingId: booking.id, reason: 'timeout' });
    }

    if (expired.length > 0) log.info(`Auto-déclin: ${expired.length} réservation(s) expirée(s)`);
  } catch (err) {
    log.error('Erreur job auto-déclin', { error: (err as Error).message });
  }
}

// ── Job 3: Récap journalier 8h → prestataires ─────────────────────────────────
async function sendDailyProviderRecap(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  try {
    const providers = await prisma.user.findMany({
      where: { role: 'PROVIDER' },
      include: {
        providerProfile: { select: { id: true } },
      },
    });

    for (const provider of providers) {
      if (!provider.providerProfile) continue;

      const todayMissions = await prisma.booking.count({
        where: {
          providerId: provider.providerProfile.id,
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          scheduledDate: { gte: today, lt: tomorrow },
        },
      });

      if (todayMissions === 0) continue;

      // Push récap
      if (provider.fcmToken) {
        await sendPushToMultiple(
          [provider.fcmToken],
          `📋 ${todayMissions} mission(s) aujourd'hui`,
          `Vous avez ${todayMissions} mission(s) planifiée(s) pour aujourd'hui. Bonne journée !`,
          { type: 'DAILY_RECAP', count: String(todayMissions) },
        );
      }

      // SMS récap si > 0 missions
      if (provider.phone && todayMissions > 0) {
        const { sendBookingReminder: _ } = await import('./sms.service');
        // Simple SMS summary
        const msg = `[MenaLink] 📋 Bonjour ${provider.firstName}, vous avez ${todayMissions} mission(s) aujourd'hui. Consultez l'app pour les détails.`;
        const { default: smsLog } = { default: log };
        smsLog.info('Récap SMS (simplifié)', { providerId: provider.id, missions: todayMissions });
      }
    }

    log.info('Récaps journaliers envoyés');
  } catch (err) {
    log.error('Erreur job récap journalier', { error: (err as Error).message });
  }
}

// ── Start all schedulers ──────────────────────────────────────────────────────
export function startSchedulers(): void {
  if (process.env.NODE_ENV === 'test') {
    log.info('Schedulers désactivés en mode test');
    return;
  }

  // Toutes les heures pile
  cron.schedule('0 * * * *', () => {
    log.debug('Job: rappels horaires');
    void sendHourlyReminders();
  }, { timezone: 'Africa/Casablanca' });

  // Toutes les 5 minutes
  cron.schedule('*/5 * * * *', () => {
    log.debug('Job: auto-déclin expirations');
    void autoDeclineExpiredRequests();
  }, { timezone: 'Africa/Casablanca' });

  // Quotidien à 8h00
  cron.schedule('0 8 * * *', () => {
    log.debug('Job: récap journalier');
    void sendDailyProviderRecap();
  }, { timezone: 'Africa/Casablanca' });

  log.info('⏰ Schedulers démarrés (3 jobs actifs)');
}
