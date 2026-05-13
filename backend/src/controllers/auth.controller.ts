import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { UserRole } from '../../../shared/types';

const registerSchema = z.object({
  firebaseUid: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.enum([UserRole.CLIENT, UserRole.PROVIDER]),
  pricePerHour: z.number().positive().optional(),
});

/**
 * Crée un profil utilisateur après l'inscription Firebase.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { firebaseUid: data.firebaseUid }] },
    });
    if (existing) throw new AppError(409, 'Utilisateur déjà enregistré');

    const user = await prisma.user.create({
      data: {
        firebaseUid: data.firebaseUid,
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        ...(data.role === UserRole.PROVIDER && {
          providerProfile: {
            create: {
              pricePerHour: data.pricePerHour ?? 100,
            },
          },
        }),
      },
      include: { providerProfile: data.role === UserRole.PROVIDER },
    });

    sendSuccess(res, user, 201, 'Compte créé avec succès');
  } catch (err) {
    next(err);
  }
}

/**
 * Retourne le profil de l'utilisateur authentifié.
 */
export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { providerProfile: true, addresses: true },
    });
    if (!user) throw new AppError(404, 'Utilisateur introuvable');

    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}
