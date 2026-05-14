import nodemailer from 'nodemailer';
import { createLogger } from '../utils/logger';
const log = createLogger('email');

// ── Transporter ──────────────────────────────────────────────────────────────
function getTransporter() {
  const host = process.env.SMTP_HOST ?? 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
    },
    tls: { rejectUnauthorized: false },
  });
}

const FROM = `"MenaLink" <${process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@menalink.ma'}>`;
const APP_URL = process.env.APP_URL ?? 'https://menalink.ma';
const PRIMARY = '#2980B9';
const DARK = '#2C3E50';

// ── Shared HTML shell ────────────────────────────────────────────────────────
function htmlShell(preheader: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MenaLink</title></head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:'Segoe UI',Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
      <!-- Header -->
      <tr><td style="background:${DARK};padding:28px 40px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">
          <span style="color:${PRIMARY};">Mena</span>Link
        </h1>
        <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:12px;">Services à domicile · المغرب</p>
      </td></tr>
      <!-- Content -->
      <tr><td style="padding:40px;">${content}</td></tr>
      <!-- Footer -->
      <tr><td style="background:#F8F9FA;padding:24px 40px;text-align:center;border-top:1px solid #E9ECEF;">
        <p style="color:#ADB5BD;font-size:12px;margin:0;">© ${new Date().getFullYear()} MenaLink · Tous droits réservés</p>
        <p style="color:#ADB5BD;font-size:11px;margin:8px 0 0;">
          <a href="${APP_URL}/unsubscribe" style="color:#ADB5BD;">Se désabonner</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function btn(label: string, url: string): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background:${PRIMARY};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">${label}</a>
  </div>`;
}

function h2(text: string): string {
  return `<h2 style="color:${DARK};font-size:20px;margin:0 0 16px;font-weight:600;">${text}</h2>`;
}

function p(text: string): string {
  return `<p style="color:#495057;font-size:15px;line-height:1.6;margin:0 0 16px;">${text}</p>`;
}

function kv(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 16px;font-weight:600;color:${DARK};font-size:14px;width:150px;">${label}</td>
    <td style="padding:10px 16px;color:#495057;font-size:14px;">${value}</td>
  </tr>`;
}

function table(rows: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E9ECEF;border-radius:8px;overflow:hidden;margin:16px 0;">${rows}</table>`;
}

// ── Send helper ──────────────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string): Promise<void> {
  try {
    const info = await getTransporter().sendMail({ from: FROM, to, subject, html });
    log.info('Email envoyé', { to, subject, messageId: info.messageId });
  } catch (err) {
    log.error('Erreur envoi email', { to, subject, error: (err as Error).message });
    // Non bloquant — ne pas throw, juste logger
  }
}

// ── 1. Welcome Client ────────────────────────────────────────────────────────
export async function emailWelcomeClient(user: { firstName: string; lastName: string; email: string }): Promise<void> {
  const html = htmlShell(
    `Bienvenue ${user.firstName} ! Votre compte MenaLink est prêt.`,
    h2(`Bienvenue, ${user.firstName} !`) +
    p(`Votre compte MenaLink a été créé avec succès. Vous pouvez maintenant réserver vos services à domicile en quelques clics.`) +
    table(
      kv('Nom complet', `${user.firstName} ${user.lastName}`) +
      kv('Email', user.email) +
      kv('Statut', '✅ Actif')
    ) +
    h2('Commencez dès maintenant') +
    p('Explorez nos prestataires vérifiés, comparez les tarifs et réservez en toute confiance.') +
    btn('Réserver un service', `${APP_URL}/search`) +
    p(`<small style="color:#ADB5BD;">Si vous n'avez pas créé ce compte, contactez-nous à <a href="mailto:support@menalink.ma">support@menalink.ma</a>.</small>`)
  );
  await send(user.email, 'Bienvenue sur MenaLink ! 🎉', html);
}

// ── 2. Provider Approved ─────────────────────────────────────────────────────
export async function emailProviderApproved(provider: { firstName: string; lastName: string; email: string }): Promise<void> {
  const html = htmlShell(
    `Félicitations ${provider.firstName} ! Votre compte prestataire est approuvé.`,
    h2(`Félicitations ${provider.firstName} ! ✅`) +
    p(`Votre compte prestataire a été <strong style="color:#27AE60;">vérifié et approuvé</strong>. Vous pouvez maintenant recevoir des demandes de réservation.`) +
    p('Voici les prochaines étapes pour bien démarrer :') +
    `<ol style="color:#495057;font-size:15px;line-height:2;padding-left:20px;">
      <li>Complétez votre profil et ajoutez vos photos</li>
      <li>Définissez vos tarifs et disponibilités</li>
      <li>Activez les notifications pour ne manquer aucune demande</li>
    </ol>` +
    btn('Accéder à mon espace', `${APP_URL}/provider/dashboard`)
  );
  await send(provider.email, 'Votre compte prestataire est approuvé ✅', html);
}

// ── 3. Provider Rejected ─────────────────────────────────────────────────────
export async function emailProviderRejected(provider: { firstName: string; lastName: string; email: string }, reason: string): Promise<void> {
  const html = htmlShell(
    `Information concernant votre demande d'inscription prestataire.`,
    h2(`Bonjour ${provider.firstName},`) +
    p(`Nous avons examiné votre dossier prestataire. Malheureusement, nous ne pouvons pas valider votre compte pour la raison suivante :`) +
    `<div style="background:#FFF5F5;border-left:4px solid #E74C3C;padding:16px;border-radius:4px;margin:16px 0;color:#C0392B;font-size:14px;">${reason}</div>` +
    p(`Vous pouvez soumettre à nouveau votre dossier avec les documents corrects. Notre équipe re-examinera votre demande dans les 48h.`) +
    btn('Corriger mon dossier', `${APP_URL}/provider/register`) +
    p(`Des questions ? Contactez-nous à <a href="mailto:support@menalink.ma" style="color:${PRIMARY};">support@menalink.ma</a>`)
  );
  await send(provider.email, 'Votre demande prestataire — information importante', html);
}

// ── 4. Booking Confirmed ─────────────────────────────────────────────────────
export async function emailBookingConfirmed(booking: {
  clientEmail: string; clientName: string; providerName: string;
  serviceType: string; scheduledDate: string; scheduledTime: string;
  durationHours: number; totalAmount: number; bookingId: string;
  address?: string;
}): Promise<void> {
  const html = htmlShell(
    `Réservation confirmée avec ${booking.providerName}`,
    h2('Votre réservation est confirmée ! 🗓️') +
    p(`Bonjour ${booking.clientName}, votre réservation a bien été confirmée par <strong>${booking.providerName}</strong>.`) +
    table(
      kv('Service', booking.serviceType) +
      kv('Prestataire', booking.providerName) +
      kv('Date', new Date(booking.scheduledDate).toLocaleDateString('fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })) +
      kv('Heure', booking.scheduledTime) +
      kv('Durée', `${booking.durationHours}h`) +
      kv('Adresse', booking.address ?? 'À confirmer') +
      kv('Montant', `${booking.totalAmount.toFixed(2)} MAD`)
    ) +
    btn('Voir ma réservation', `${APP_URL}/bookings/${booking.bookingId}`) +
    p(`<small style="color:#ADB5BD;">En cas de question ou de besoin d'annulation, contactez-nous au moins ${process.env.CANCELLATION_DELAY_HOURS ?? 24}h avant.</small>`)
  );
  await send(booking.clientEmail, `Réservation confirmée avec ${booking.providerName} 📅`, html);
}

// ── 5. Booking Cancelled ─────────────────────────────────────────────────────
export async function emailBookingCancelled(booking: {
  clientEmail: string; clientName: string; serviceType: string;
  scheduledDate: string; totalAmount: number; bookingId: string;
  cancelledBy?: string; reason?: string;
}): Promise<void> {
  const html = htmlShell(
    `Annulation de votre réservation du ${booking.scheduledDate}`,
    h2('Réservation annulée') +
    p(`Bonjour ${booking.clientName}, votre réservation du <strong>${new Date(booking.scheduledDate).toLocaleDateString('fr-MA')}</strong> pour le service <strong>${booking.serviceType}</strong> a été annulée${booking.cancelledBy ? ` par ${booking.cancelledBy}` : ''}.`) +
    (booking.reason ? `<div style="background:#FFF9E6;border-left:4px solid #E67E22;padding:16px;border-radius:4px;margin:16px 0;color:#8B6914;font-size:14px;"><strong>Motif :</strong> ${booking.reason}</div>` : '') +
    h2('Politique de remboursement') +
    `<ul style="color:#495057;font-size:15px;line-height:2;padding-left:20px;">
      <li>Annulation &gt; 24h avant : <strong style="color:#27AE60;">Remboursement intégral sous 3-5 jours</strong></li>
      <li>Annulation &lt; 24h : <strong style="color:#E67E22;">Frais d'annulation de 20%</strong></li>
    </ul>` +
    btn('Réserver à nouveau', `${APP_URL}/search`)
  );
  await send(booking.clientEmail, 'Annulation de votre réservation', html);
}

// ── 6. Payment Receipt ───────────────────────────────────────────────────────
export async function emailPaymentReceipt(transaction: {
  clientEmail: string; clientName: string; bookingId: string;
  amount: number; transactionId: string; serviceType: string;
  scheduledDate: string; paymentMethod?: string;
}): Promise<void> {
  const html = htmlShell(
    `Reçu de paiement de ${transaction.amount.toFixed(2)} MAD`,
    h2('Reçu de paiement ✅') +
    p(`Bonjour ${transaction.clientName}, voici le reçu pour votre paiement.`) +
    table(
      kv('Réf. transaction', `<code style="font-family:monospace;font-size:12px;">${transaction.transactionId.slice(0, 8).toUpperCase()}</code>`) +
      kv('Service', transaction.serviceType) +
      kv('Date prestation', new Date(transaction.scheduledDate).toLocaleDateString('fr-MA')) +
      kv('Moyen de paiement', transaction.paymentMethod ?? 'Carte bancaire') +
      kv('Montant payé', `<strong style="color:${PRIMARY};font-size:16px;">${transaction.amount.toFixed(2)} MAD</strong>`) +
      kv('Statut', '<span style="color:#27AE60;font-weight:600;">✅ Payé</span>')
    ) +
    p(`<small style="color:#ADB5BD;">Conservez cet email comme justificatif de paiement. Ref: ${transaction.transactionId}</small>`) +
    btn('Voir la réservation', `${APP_URL}/bookings/${transaction.bookingId}`)
  );
  await send(transaction.clientEmail, `Reçu de paiement — ${transaction.amount.toFixed(2)} MAD`, html);
}

// ── 7. Withdrawal Processed ──────────────────────────────────────────────────
export async function emailWithdrawalProcessed(withdrawal: {
  providerEmail: string; providerName: string;
  amount: number; withdrawalId: string;
  bankName?: string; rib?: string;
}): Promise<void> {
  const html = htmlShell(
    `Virement de ${withdrawal.amount.toFixed(2)} MAD effectué`,
    h2('Votre virement a été effectué 💸') +
    p(`Bonjour ${withdrawal.providerName}, votre demande de retrait a été traitée avec succès.`) +
    table(
      kv('Réf. retrait', `<code style="font-family:monospace;font-size:12px;">${withdrawal.withdrawalId.slice(0, 8).toUpperCase()}</code>`) +
      kv('Montant', `<strong style="color:${PRIMARY};font-size:16px;">${withdrawal.amount.toFixed(2)} MAD</strong>`) +
      kv('Banque', withdrawal.bankName ?? '—') +
      kv('RIB', withdrawal.rib ? `****${withdrawal.rib.slice(-4)}` : '—') +
      kv('Délai', '1-3 jours ouvrables') +
      kv('Statut', '<span style="color:#27AE60;font-weight:600;">✅ En cours de traitement</span>')
    ) +
    p(`Le virement sera crédité sur votre compte bancaire dans un délai de 1 à 3 jours ouvrables.`) +
    btn('Voir mes revenus', `${APP_URL}/provider/earnings`)
  );
  await send(withdrawal.providerEmail, `Virement de ${withdrawal.amount.toFixed(2)} MAD — En cours`, html);
}
