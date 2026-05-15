import { Request, Response, NextFunction } from 'express';
import * as earningsService from '../services/earnings.service';
import { ok, paginated, buildPagination } from '../utils/response';

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await earningsService.getEarningsSummary(req.userId, req.validatedQuery);
    ok(res, summary);
  } catch (err) { next(err); }
}

export async function getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.pagination;
    const { items, total } = await earningsService.getEarningsTransactions(req.userId, page, limit);
    paginated(res, items, buildPagination(total, page, limit));
  } catch (err) { next(err); }
}

export async function requestWithdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const withdrawal = await earningsService.requestWithdrawal(req.userId, req.body);
    ok(res, withdrawal, 'Demande de virement soumise');
  } catch (err) { next(err); }
}

export async function listWithdrawals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.pagination;
    const { items, total } = await earningsService.listWithdrawals(req.userId, page, limit);
    paginated(res, items, buildPagination(total, page, limit));
  } catch (err) { next(err); }
}
