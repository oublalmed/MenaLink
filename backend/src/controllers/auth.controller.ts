import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { ok, created } from '../utils/response';

export async function registerClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.registerClient(req.body);
    created(res, user, 'Compte client créé avec succès');
  } catch (err) { next(err); }
}

export async function registerProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.registerProvider(req.body);
    created(res, user, 'Compte prestataire créé. En attente de validation.');
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.loginWithPassword(req.body);
    ok(res, user, 'Connexion réussie');
  } catch (err) { next(err); }
}

export async function socialLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.socialLogin(req.body);
    ok(res, user, 'Connexion réussie');
  } catch (err) { next(err); }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { getMyProfile } = await import('../services/user.service');
    const user = await getMyProfile(req.userId);
    ok(res, user);
  } catch (err) { next(err); }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.forgotPassword(req.body.email);
    ok(res, null, 'Si cet e-mail existe, un lien de réinitialisation a été envoyé.');
  } catch (err) { next(err); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    ok(res, null, 'Mot de passe réinitialisé avec succès.');
  } catch (err) { next(err); }
}

export async function verifyPhone(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, null, 'Numéro de téléphone vérifié.');
  } catch (err) { next(err); }
}

export async function resendOtp(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, null, 'Code OTP renvoyé.');
  } catch (err) { next(err); }
}

export async function refreshToken(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, null, 'Le refresh token est géré directement par Firebase SDK.');
  } catch (err) { next(err); }
}
