import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service';
import { ok, paginated, buildPagination } from '../utils/response';
import { AuthRequest } from '../middleware/authenticate';

export async function initiatePayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await paymentService.initiatePayment(req.body.bookingId as string, req.userId);
    ok(res, result, 'Paiement initié');
  } catch (err) { next(err); }
}

export async function handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await paymentService.handleWebhook(
      req.body as Record<string, unknown>,
      req.headers['x-youcan-signature'] as string ?? '',
    );
    res.json({ received: true });
  } catch (err) { next(err); }
}

export async function refundBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await paymentService.refundBooking(req.params.bookingId);
    ok(res, null, 'Remboursement effectué');
  } catch (err) { next(err); }
}

export async function getHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.pagination;
    const { items, total } = await paymentService.getTransactionHistory(req.userId, page, limit);
    paginated(res, items, buildPagination(total, page, limit));
  } catch (err) { next(err); }
}
