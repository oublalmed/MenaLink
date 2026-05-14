import { createLogger } from '../utils/logger';
const log = createLogger('sms');

// ── Types ─────────────────────────────────────────────────────────────────────
interface SMSResult { messageId: string; status: 'sent' | 'failed'; provider: string; }

interface BookingDetails {
  clientName?: string; providerName?: string;
  serviceType: string; scheduledDate: string; scheduledTime: string;
  durationHours: number; totalAmount?: number; bookingId?: string;
}

// ── Phone formatter ───────────────────────────────────────────────────────────
function formatPhone(phone: string): string {
  // Normalize to international format +212XXXXXXXXX
  let cleaned = phone.replace(/\s+|-|\(|\)/g, '');
  if (cleaned.startsWith('0')) cleaned = '+212' + cleaned.slice(1);
  if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
  return cleaned;
}

// ── Service/date formatters ───────────────────────────────────────────────────
const SERVICE_FR: Record<string, string> = {
  CLEANING: 'Ménage', IRONING: 'Repassage',
  DEEP_CLEANING: 'Grand ménage', POST_CONSTRUCTION: 'Post-chantier', COOKING: 'Cuisine',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-MA', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ── PointSMS Provider (Morocco) ───────────────────────────────────────────────
async function sendViaPointSMS(phone: string, message: string): Promise<SMSResult> {
  const apiKey  = process.env.POINTSMS_API_KEY ?? '';
  const sender  = process.env.POINTSMS_SENDER ?? 'MenaLink';
  const baseUrl = process.env.POINTSMS_BASE_URL ?? 'https://api.point-sms.com/api/v1';

  const response = await fetch(`${baseUrl}/send-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ phone_number: phone, message, sender }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PointSMS error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { message_id?: string; id?: string };
  return { messageId: data.message_id ?? data.id ?? 'unknown', status: 'sent', provider: 'pointsms' };
}

// ── Twilio Fallback ───────────────────────────────────────────────────────────
async function sendViaTwilio(phone: string, message: string): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? '';
  const authToken  = process.env.TWILIO_AUTH_TOKEN ?? '';
  const from       = process.env.TWILIO_FROM ?? '';

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${credentials}` },
      body: new URLSearchParams({ To: phone, From: from, Body: message }).toString(),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Twilio error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { sid: string };
  return { messageId: data.sid, status: 'sent', provider: 'twilio' };
}

// ── Send with fallback ────────────────────────────────────────────────────────
async function sendSMS(phone: string, message: string): Promise<SMSResult> {
  if (process.env.NODE_ENV === 'test') {
    log.debug('SMS (test mode — skipped)', { phone, message: message.slice(0, 40) });
    return { messageId: 'test-id', status: 'sent', provider: 'mock' };
  }
  const formatted = formatPhone(phone);
  try {
    if (process.env.POINTSMS_API_KEY) {
      const result = await sendViaPointSMS(formatted, message);
      log.info('SMS envoyé (PointSMS)', { phone: formatted.slice(-4), provider: 'pointsms' });
      return result;
    }
  } catch (err) {
    log.warn('PointSMS échoué, fallback Twilio', { error: (err as Error).message });
  }
  try {
    const result = await sendViaTwilio(formatted, message);
    log.info('SMS envoyé (Twilio)', { phone: formatted.slice(-4), provider: 'twilio' });
    return result;
  } catch (err) {
    log.error('Tous les providers SMS ont échoué', { phone: formatted.slice(-4), error: (err as Error).message });
    return { messageId: '', status: 'failed', provider: 'none' };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Envoie un code OTP par SMS. */
export async function sendOTP(phone: string, code: string): Promise<SMSResult> {
  const msg = `[MenaLink] Votre code de vérification : ${code}\nValable 10 minutes. Ne le partagez jamais.`;
  return sendSMS(phone, msg);
}

/** Envoie une confirmation de réservation par SMS au client. */
export async function sendBookingConfirmation(phone: string, booking: BookingDetails): Promise<void> {
  const service = SERVICE_FR[booking.serviceType] ?? booking.serviceType;
  const msg = `[MenaLink] Réservation confirmée ✅\nService : ${service}\nDate : ${formatDate(booking.scheduledDate)} à ${booking.scheduledTime}\nDurée : ${booking.durationHours}h\nPrestataire : ${booking.providerName ?? 'TBD'}\nMontant : ${booking.totalAmount?.toFixed(2) ?? '?'} MAD`;
  const result = await sendSMS(phone, msg);
  if (result.status === 'failed') log.warn('SMS confirmation non envoyé', { phone: phone.slice(-4) });
}

/** Envoie un rappel SMS 1h avant la mission. */
export async function sendBookingReminder(phone: string, booking: BookingDetails): Promise<void> {
  const service = SERVICE_FR[booking.serviceType] ?? booking.serviceType;
  const msg = `[MenaLink] ⏰ Rappel : votre service "${service}" commence dans 1h (${booking.scheduledTime}).\nPrestataire : ${booking.providerName ?? '?'}\nBesoin d'aide ? Appelez le ${process.env.SUPPORT_PHONE ?? '+212522000000'}`;
  const result = await sendSMS(phone, msg);
  if (result.status === 'failed') log.warn('SMS rappel non envoyé', { phone: phone.slice(-4) });
}

/** Notifie le client de la décision du prestataire (accepté/décliné). */
export async function sendProviderDecision(
  phone: string,
  decision: 'accepted' | 'declined',
  booking: BookingDetails,
): Promise<void> {
  const service = SERVICE_FR[booking.serviceType] ?? booking.serviceType;
  const msg = decision === 'accepted'
    ? `[MenaLink] ✅ Votre demande de "${service}" a été acceptée par ${booking.providerName ?? 'le prestataire'}. RDV le ${formatDate(booking.scheduledDate)} à ${booking.scheduledTime}.`
    : `[MenaLink] ℹ️ Votre demande de "${service}" du ${formatDate(booking.scheduledDate)} n'a pas pu être honorée. Recherchez un autre prestataire sur l'application.`;
  await sendSMS(phone, msg);
}

/** Notifie un prestataire d'une nouvelle demande de réservation. */
export async function sendNewBookingRequest(phone: string, booking: BookingDetails): Promise<void> {
  const service = SERVICE_FR[booking.serviceType] ?? booking.serviceType;
  const msg = `[MenaLink] 📩 Nouvelle demande de "${service}" pour le ${formatDate(booking.scheduledDate)} à ${booking.scheduledTime}.\nClient : ${booking.clientName ?? '?'}\nDurée : ${booking.durationHours}h\nOuvrez l'app pour accepter (30 min pour répondre).`;
  await sendSMS(phone, msg);
}
