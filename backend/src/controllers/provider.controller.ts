import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendPaginated } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { ServiceType } from '../../../shared/types';

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  pricePerHour: z.number().positive().optional(),
  coverageRadius: z.number().min(1).max(100).optional(),
  isAvailable: z.boolean().optional(),
  servicesOffered: z.array(z.nativeEnum(ServiceType)).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

/** Retourne la liste des prestataires disponibles. */
export async function getProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.providerProfile.findMany({
        where: { isAvailable: true, isVerified: true },
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, avatar: true, phone: true } } },
      }),
      prisma.providerProfile.count({ where: { isAvailable: true, isVerified: true } }),
    ]);

    sendPaginated(res, items, total, page, limit);
  } catch (err) {
    next(err);
  }
}

/** Retourne un prestataire par son identifiant. */
export async function getProviderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true } },
      },
    });
    if (!provider) throw new AppError(404, 'Prestataire introuvable');
    sendSuccess(res, provider);
  } catch (err) {
    next(err);
  }
}

/** Met à jour le profil du prestataire connecté. */
export async function updateProviderProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateProfileSchema.parse(req.body);

    const profile = await prisma.providerProfile.update({
      where: { userId: req.userId },
      data,
    });

    sendSuccess(res, profile, 200, 'Profil mis à jour');
  } catch (err) {
    next(err);
  }
}
