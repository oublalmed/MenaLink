import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import { ok, paginated, buildPagination } from '../utils/response';
import { AuthRequest } from '../middleware/authenticate';

export async function getDashboard(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kpis = await adminService.getDashboardKPIs();
    ok(res, kpis);
  } catch (err) { next(err); }
}

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.validatedQuery;
    const { items, total } = await adminService.listUsers(q);
    paginated(res, items, buildPagination(total, q.page, q.limit));
  } catch (err) { next(err); }
}

export async function setUserStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

export async function listPendingProviders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.pagination;
    const { items, total } = await adminService.listPendingProviders(page, limit);
    paginated(res, items, buildPagination(total, page, limit));
  } catch (err) { next(err); }
}

export async function verifyProvider(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await adminService.verifyProvider(req.params.id, req.userId, req.body);
    ok(res, result, 'Prestataire traité');
  } catch (err) { next(err); }
}

export async function listAllBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.validatedQuery;
    const { items, total } = await adminService.listAllBookings(q);
    paginated(res, items, buildPagination(total, q.page, q.limit));
  } catch (err) { next(err); }
}

export async function listAllTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.pagination;
    const { items, total } = await adminService.listAllTransactions(page, limit);
    paginated(res, items, buildPagination(total, page, limit));
  } catch (err) { next(err); }
}

export async function listDisputes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.pagination;
    const { items, total } = await adminService.listDisputes(page, limit);
    paginated(res, items, buildPagination(total, page, limit));
  } catch (err) { next(err); }
}

export async function resolveDispute(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const dispute = await adminService.resolveDispute(req.params.id, req.userId, req.body);
    ok(res, dispute, 'Litige résolu');
  } catch (err) { next(err); }
}

export async function getSettings(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await adminService.getSettings();
    ok(res, settings);
  } catch (err) { next(err); }
}

export async function updateSetting(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const setting = await adminService.updateSetting(req.params.key, req.body);
    ok(res, setting, 'Paramètre mis à jour');
  } catch (err) { next(err); }
}
