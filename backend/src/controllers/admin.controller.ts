import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import { ok, paginated, buildPagination } from '../utils/response';

export async function getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const kpis = await adminService.getDashboardKPIs();
    ok(res, kpis);
  } catch (err) { next(err); }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.validatedQuery;
    const { items, total } = await adminService.listUsers(q);
    paginated(res, items, buildPagination(total, q.page, q.limit));
  } catch (err) { next(err); }
}

export async function setUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await adminService.setUserStatus(req.params.id, req.body);
    ok(res, user, 'Statut mis à jour');
  } catch (err) { next(err); }
}

export async function listAllProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page   = Math.max(1, Number(req.query.page)  || 1);
    const limit  = Math.min(50, Number(req.query.limit) || 15);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const result = await adminService.listAllProviders({ page, limit, status, search });
    ok(res, result);
  } catch (err) { next(err); }
}

export async function listPendingProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.pagination;
    const { items, total } = await adminService.listPendingProviders(page, limit);
    paginated(res, items, buildPagination(total, page, limit));
  } catch (err) { next(err); }
}

export async function verifyProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await adminService.verifyProvider(req.params.id, req.userId, req.body);
    ok(res, result, 'Prestataire traité');
  } catch (err) { next(err); }
}

export async function listAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.validatedQuery;
    const { items, total } = await adminService.listAllBookings(q);
    paginated(res, items, buildPagination(total, q.page, q.limit));
  } catch (err) { next(err); }
}

export async function listAllTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.pagination;
    const { items, total } = await adminService.listAllTransactions(page, limit);
    paginated(res, items, buildPagination(total, page, limit));
  } catch (err) { next(err); }
}

export async function listDisputes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.pagination;
    const { items, total } = await adminService.listDisputes(page, limit);
    paginated(res, items, buildPagination(total, page, limit));
  } catch (err) { next(err); }
}

export async function resolveDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dispute = await adminService.resolveDispute(req.params.id, req.userId, req.body);
    ok(res, dispute, 'Litige résolu');
  } catch (err) { next(err); }
}

export async function getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await adminService.getSettings();
    ok(res, settings);
  } catch (err) { next(err); }
}

export async function updateSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const setting = await adminService.updateSetting(req.params.key, req.body);
    ok(res, setting, 'Paramètre mis à jour');
  } catch (err) { next(err); }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await adminService.getUserById(req.params.id);
    if (!user) { res.status(404).json({ success: false, error: { message: 'Utilisateur introuvable' } }); return; }
    ok(res, user);
  } catch (err) { next(err); }
}

export async function updateBookingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await adminService.updateBookingStatus(req.params.id, req.body.status, req.userId);
    ok(res, booking, 'Statut mis à jour');
  } catch (err) { next(err); }
}

export async function getDisputeById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dispute = await adminService.getDisputeById(req.params.id);
    if (!dispute) { res.status(404).json({ success: false, error: { message: 'Litige introuvable' } }); return; }
    ok(res, dispute);
  } catch (err) { next(err); }
}

export async function listWithdrawals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.pagination;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const { items, total } = await adminService.listWithdrawals(page, limit, status);
    paginated(res, items, buildPagination(total, page, limit));
  } catch (err) { next(err); }
}

export async function updateWithdrawal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, notes } = req.body as { status: 'PROCESSED' | 'REJECTED'; notes?: string };
    const withdrawal = await adminService.updateWithdrawal(req.params.id, status, notes);
    ok(res, withdrawal, 'Retrait mis à jour');
  } catch (err) { next(err); }
}

export async function getPaymentsStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await adminService.getPaymentsStats();
    ok(res, stats);
  } catch (err) { next(err); }
}
