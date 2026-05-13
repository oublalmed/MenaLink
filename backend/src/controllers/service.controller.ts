import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { ServiceType } from '../../../shared/types';

const serviceSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  type: z.nativeEnum(ServiceType),
  basePrice: z.number().positive(),
  durationHours: z.number().min(0.5).max(12),
  imageUrl: z.string().url().optional(),
});

/** Retourne la liste des services actifs. */
export async function getServices(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { basePrice: 'asc' },
    });
    sendSuccess(res, services);
  } catch (err) {
    next(err);
  }
}

/** Retourne un service par son identifiant. */
export async function getServiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const service = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!service) throw new AppError(404, 'Service introuvable');
    sendSuccess(res, service);
  } catch (err) {
    next(err);
  }
}

/** Crée un nouveau service (admin). */
export async function createService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = serviceSchema.parse(req.body);
    const service = await prisma.service.create({ data });
    sendSuccess(res, service, 201);
  } catch (err) {
    next(err);
  }
}

/** Met à jour un service existant (admin). */
export async function updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = serviceSchema.partial().parse(req.body);
    const service = await prisma.service.update({ where: { id: req.params.id }, data });
    sendSuccess(res, service);
  } catch (err) {
    next(err);
  }
}
