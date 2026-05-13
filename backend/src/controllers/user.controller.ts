import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';

const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  avatar: z.string().url().optional(),
});

const addressSchema = z.object({
  label: z.string().min(2),
  street: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().default('MA'),
  lat: z.number(),
  lng: z.number(),
  isDefault: z.boolean().default(false),
});

/** Met à jour le profil de l'utilisateur connecté. */
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.userId }, data });
    sendSuccess(res, user, 200, 'Profil mis à jour');
  } catch (err) {
    next(err);
  }
}

/** Ajoute une adresse à l'utilisateur connecté. */
export async function addAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = addressSchema.parse(req.body);

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { ...data, userId: req.userId! },
    });

    sendSuccess(res, address, 201);
  } catch (err) {
    next(err);
  }
}

/** Retourne les adresses de l'utilisateur connecté. */
export async function getAddresses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const addresses = await prisma.address.findMany({ where: { userId: req.userId } });
    sendSuccess(res, addresses);
  } catch (err) {
    next(err);
  }
}

/** Met à jour le token FCM de l'utilisateur pour les push notifications. */
export async function updateFcmToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fcmToken } = z.object({ fcmToken: z.string().min(1) }).parse(req.body);
    await prisma.user.update({ where: { id: req.userId }, data: { fcmToken } });
    sendSuccess(res, null, 200, 'Token FCM mis à jour');
  } catch (err) {
    next(err);
  }
}
