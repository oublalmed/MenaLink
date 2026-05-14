import { Request, Response, NextFunction } from 'express';
import { ok } from '../utils/response';

const SERVICE_CATALOG = [
  { type: 'CLEANING',           name: 'Ménage classique',    description: 'Nettoyage standard de votre domicile : sols, surfaces, sanitaires.', basePrice: 80,  durationHours: 2, icon: '🧹' },
  { type: 'IRONING',            name: 'Repassage',           description: 'Repassage de vêtements et linge de maison.', basePrice: 60, durationHours: 1.5, icon: '🧺' },
  { type: 'DEEP_CLEANING',      name: 'Grand ménage',        description: 'Nettoyage complet et approfondi de toutes les pièces.', basePrice: 150, durationHours: 4, icon: '🧼' },
  { type: 'POST_CONSTRUCTION',  name: 'Post-chantier',       description: 'Nettoyage après travaux de construction ou rénovation.', basePrice: 200, durationHours: 5, icon: '🏗️' },
  { type: 'COOKING',            name: 'Cuisine à domicile',  description: 'Préparation de repas à domicile par un cuisinier professionnel.', basePrice: 120, durationHours: 3, icon: '🍳' },
];

export async function getServices(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, SERVICE_CATALOG);
  } catch (err) { next(err); }
}

export async function getServiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const service = SERVICE_CATALOG.find(s => s.type === req.params.id.toUpperCase());
    if (!service) { res.status(404).json({ success: false, error: { message: 'Service introuvable' } }); return; }
    ok(res, service);
  } catch (err) { next(err); }
}

export async function createService(_req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, error: { message: 'Le catalogue est géré statiquement. Contactez l\'équipe technique.' } });
}

export async function updateService(_req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, error: { message: 'Le catalogue est géré statiquement. Contactez l\'équipe technique.' } });
}
