import { Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { ok } from '../utils/response';
import { AuthRequest } from '../middleware/authenticate';
import { AppError, ErrorCode } from '../utils/errors';

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getMyProfile(req.userId);
    ok(res, user);
  } catch (err) { next(err); }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.updateMyProfile(req.userId, req.body);
    ok(res, user, 'Profil mis à jour');
  } catch (err) { next(err); }
}

export async function updateAvatar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Aucun fichier fourni');
    // Dans un vrai environnement, uploader vers S3/Cloudinary et retourner l'URL
    const avatarUrl = `https://storage.menalink.ma/avatars/${req.userId}_${Date.now()}.jpg`;
    const user = await userService.updateAvatar(req.userId, avatarUrl);
    ok(res, user, 'Photo de profil mise à jour');
  } catch (err) { next(err); }
}

export async function deleteMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteMyAccount(req.userId);
    ok(res, null, 'Compte supprimé');
  } catch (err) { next(err); }
}

export async function getUserById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(req.params.id);
    ok(res, user);
  } catch (err) { next(err); }
}

export async function updateFcmToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.updateFcmToken(req.userId, req.body.fcmToken as string);
    ok(res, null, 'Token FCM mis à jour');
  } catch (err) { next(err); }
}
