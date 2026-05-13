import { prisma } from '../config/prisma';
import { AppError, ErrorCode } from '../utils/errors';
import type { z } from 'zod';
import type { updateUserSchema } from '../schemas/user.schemas';

type UpdateUserDto = z.infer<typeof updateUserSchema>;

const publicSelect = {
  id: true, email: true, phone: true,
  firstName: true, lastName: true,
  role: true, status: true, avatarUrl: true,
  createdAt: true, lastLoginAt: true,
} as const;

/** Retourne le profil complet de l'utilisateur courant. */
export async function getMyProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where:   { id: userId },
    select:  {
      ...publicSelect,
      providerProfile: {
        include: { services: true, zones: true, earnings: true },
      },
      clientAddresses: true,
    },
  });
  if (!user) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Utilisateur introuvable');
  return user;
}

/** Modifie le profil de l'utilisateur courant. */
export async function updateMyProfile(userId: string, dto: UpdateUserDto) {
  if (dto.phone) {
    const existing = await prisma.user.findFirst({
      where: { phone: dto.phone, NOT: { id: userId } },
      select: { id: true },
    });
    if (existing) throw AppError.conflict(ErrorCode.AUTH_PHONE_TAKEN, 'Numéro déjà utilisé');
  }

  return prisma.user.update({
    where:  { id: userId },
    data:   dto,
    select: publicSelect,
  });
}

/** Met à jour l'URL de l'avatar. */
export async function updateAvatar(userId: string, avatarUrl: string) {
  return prisma.user.update({
    where:  { id: userId },
    data:   { avatarUrl },
    select: publicSelect,
  });
}

/** Désactive le compte (soft delete). */
export async function deleteMyAccount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data:  { status: 'SUSPENDED', firebaseUid: null, fcmToken: null },
  });
}

/** Retourne le profil public d'un user (admin). */
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where:  { id },
    select: { ...publicSelect, providerProfile: true },
  });
  if (!user) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Utilisateur introuvable');
  return user;
}

/** Met à jour le token FCM. */
export async function updateFcmToken(userId: string, fcmToken: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { fcmToken } });
}
