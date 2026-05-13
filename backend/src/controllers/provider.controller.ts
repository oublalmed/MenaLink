import { Request, Response, NextFunction } from 'express';
import * as providerService from '../services/provider.service';
import { ok, paginated, buildPagination } from '../utils/response';
import { AuthRequest } from '../middleware/authenticate';
import { AppError, ErrorCode } from '../utils/errors';

export async function listProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.validatedQuery;
    const { items, total } = await providerService.listProviders(q);
    paginated(res, items, buildPagination(total, q.page, q.limit));
  } catch (err) { next(err); }
}

export async function getProviderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await providerService.getProviderById(req.params.id);
    ok(res, profile);
  } catch (err) { next(err); }
}

export async function getProviderAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const availability = await providerService.getProviderAvailability(req.params.id);
    ok(res, availability);
  } catch (err) { next(err); }
}

export async function updateProviderProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await providerService.updateProviderProfile(req.userId, req.body);
    ok(res, profile, 'Profil mis à jour');
  } catch (err) { next(err); }
}

export async function updateLocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await providerService.updateProviderLocation(req.userId, req.body);
    ok(res, null, 'Position mise à jour');
  } catch (err) { next(err); }
}

export async function uploadDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Aucun fichier fourni');

    // Dans un vrai env, uploader vers S3 et retourner les URLs signées
    const docs: { cinFrontUrl?: string; cinBackUrl?: string; portraitUrl?: string } = {};
    files.forEach((f) => {
      const url = `https://storage.menalink.ma/docs/${req.userId}_${f.fieldname}_${Date.now()}.jpg`;
      if (f.fieldname === 'cin_front') docs.cinFrontUrl = url;
      if (f.fieldname === 'cin_back')  docs.cinBackUrl  = url;
      if (f.fieldname === 'portrait')  docs.portraitUrl = url;
    });

    await providerService.uploadDocuments(req.userId, docs);
    ok(res, docs, 'Documents uploadés avec succès');
  } catch (err) { next(err); }
}

export async function getNearbyProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.validatedQuery;
    const { items, total } = await providerService.getNearbyProviders(
      q.lat, q.lng, q.radiusKm, q.service, q.page, q.limit,
    );
    paginated(res, items, buildPagination(total, q.page, q.limit));
  } catch (err) { next(err); }
}

// stub disponibilités (PUT)
export async function updateAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await providerService.updateProviderProfile(req.userId, { isAvailable: req.body.isAvailable as boolean });
    ok(res, null, 'Disponibilité mise à jour');
  } catch (err) { next(err); }
}
