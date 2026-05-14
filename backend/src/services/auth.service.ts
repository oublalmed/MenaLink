import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { firebaseAuth } from '../config/firebase';
import { AppError, ErrorCode } from '../utils/errors';
import type { z } from 'zod';
import type {
  registerClientSchema,
  registerProviderSchema,
  loginSchema,
  socialLoginSchema,
} from '../schemas/auth.schemas';

type RegisterClientDto   = z.infer<typeof registerClientSchema>;
type RegisterProviderDto = z.infer<typeof registerProviderSchema>;
type LoginDto            = z.infer<typeof loginSchema>;
type SocialLoginDto      = z.infer<typeof socialLoginSchema>;

const SALT_ROUNDS = 12;

// ─── Inscription client ───────────────────────────────────────────────────────

export async function registerClient(dto: RegisterClientDto) {
  await assertEmailPhone(dto.email, dto.phone);

  const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email:       dto.email,
      phone:       dto.phone,
      passwordHash,
      firstName:   dto.firstName,
      lastName:    dto.lastName,
      role:        UserRole.CLIENT,
      status:      UserStatus.ACTIVE,
      firebaseUid: dto.firebaseUid ?? null,
    },
    select: safeUserSelect,
  });

  return user;
}

// ─── Inscription prestataire ──────────────────────────────────────────────────

export async function registerProvider(dto: RegisterProviderDto) {
  await assertEmailPhone(dto.email, dto.phone);

  const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email:       dto.email,
      phone:       dto.phone,
      passwordHash,
      firstName:   dto.firstName,
      lastName:    dto.lastName,
      role:        UserRole.PROVIDER,
      status:      UserStatus.PENDING,
      firebaseUid: dto.firebaseUid ?? null,
      providerProfile: {
        create: {
          bio:          dto.bio ?? null,
          hourlyRateMin: dto.hourlyRateMin,
          hourlyRateMax: dto.hourlyRateMax,
        },
      },
    },
    select: { ...safeUserSelect, providerProfile: true },
  });

  return user;
}

// ─── Connexion email/mdp ──────────────────────────────────────────────────────

export async function loginWithPassword(dto: LoginDto) {
  const user = await prisma.user.findUnique({
    where:  { email: dto.email },
    select: { ...safeUserSelect, passwordHash: true, status: true },
  });

  if (!user || !user.passwordHash) {
    throw AppError.badRequest(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Identifiants invalides');
  }

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) {
    throw AppError.badRequest(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Identifiants invalides');
  }

  assertActiveStatus(user.status);

  await prisma.user.update({
    where: { id: user.id },
    data:  { lastLoginAt: new Date() },
  });

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

// ─── Social login (Firebase token) ───────────────────────────────────────────

export async function socialLogin(dto: SocialLoginDto) {
  let decoded: { uid: string; email?: string; name?: string; phone_number?: string };
  try {
    decoded = await firebaseAuth().verifyIdToken(dto.firebaseToken);
  } catch {
    throw AppError.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, 'Token Firebase invalide');
  }

  let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid }, select: safeUserSelect });

  if (!user) {
    // Premier login social — créer le compte
    const email = decoded.email ?? `${decoded.uid}@social.menalink.ma`;
    const [firstName, ...rest] = (decoded.name ?? 'Utilisateur').split(' ');
    user = await prisma.user.create({
      data: {
        email,
        phone:       decoded.phone_number ?? `+2126${decoded.uid.slice(0, 8)}`,
        firstName,
        lastName:    rest.join(' ') || 'Social',
        role:        dto.role,
        status:      UserStatus.ACTIVE,
        firebaseUid: decoded.uid,
      },
      select: safeUserSelect,
    });
  }

  assertActiveStatus(user.status);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertEmailPhone(email: string, phone: string): Promise<void> {
  const [byEmail, byPhone] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { phone }, select: { id: true } }),
  ]);
  if (byEmail) throw AppError.conflict(ErrorCode.AUTH_EMAIL_TAKEN, 'Cet email est déjà utilisé');
  if (byPhone) throw AppError.conflict(ErrorCode.AUTH_PHONE_TAKEN, 'Ce numéro est déjà utilisé');
}

function assertActiveStatus(status: UserStatus): void {
  if (status === UserStatus.SUSPENDED) throw AppError.forbidden(ErrorCode.AUTH_ACCOUNT_SUSPENDED, 'Compte suspendu');
  if (status === UserStatus.BANNED)    throw AppError.forbidden(ErrorCode.AUTH_ACCOUNT_BANNED, 'Compte banni');
  if (status === UserStatus.PENDING)   throw AppError.forbidden(ErrorCode.AUTH_ACCOUNT_PENDING, 'Compte en attente de validation');
}

const safeUserSelect = {
  id:         true,
  email:      true,
  phone:      true,
  firstName:  true,
  lastName:   true,
  role:       true,
  status:     true,
  avatarUrl:  true,
  firebaseUid: true,
  createdAt:  true,
  lastLoginAt: true,
} as const;

// ─── Réinitialisation de mot de passe ────────────────────────────────────────

/** Envoie un e-mail de réinitialisation de mot de passe via Firebase Auth. */
export async function forgotPassword(email: string): Promise<void> {
  // Check user exists (silently succeed even if not, to avoid email enumeration)
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, status: true } });
  if (!user || user.status === 'BANNED') return;

  // Delegate to Firebase Auth — it sends the reset email
  try {
    const { firebaseAdmin } = await import('../config/firebase');
    const resetLink = await firebaseAdmin.auth().generatePasswordResetLink(email);
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM ?? 'MenaLink <noreply@menalink.ma>',
      to:      email,
      subject: 'Réinitialisation de votre mot de passe MenaLink',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#E8963A">Réinitialiser votre mot de passe</h2>
          <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
          <a href="${resetLink}" style="display:inline-block;background:#E8963A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Réinitialiser le mot de passe
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px">Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.</p>
        </div>
      `,
    });
  } catch {
    // Swallow errors — do not reveal whether email exists
  }
}

/** Vérifie un code OTP (délégué à Firebase — le client réinitialise directement via SDK). */
export async function resetPassword(_token: string, _newPassword: string): Promise<void> {
  // Firebase handles password reset client-side via confirmPasswordReset().
  // This endpoint is a no-op stub for REST completeness.
  throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Utilisez le SDK Firebase côté client pour confirmer la réinitialisation.');
}
