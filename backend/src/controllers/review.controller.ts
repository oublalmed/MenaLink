import { Request, Response, NextFunction } from 'express';
import * as reviewService from '../services/review.service';
import { ok, created, paginated, buildPagination } from '../utils/response';

export async function createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const review = await reviewService.createReview(req.userId, req.body);
    created(res, review, 'Avis soumis');
  } catch (err) { next(err); }
}

export async function getProviderReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.validatedQuery;
    const { items, total } = await reviewService.getProviderReviews(req.params.id, q);
    paginated(res, items, buildPagination(total, q.page, q.limit));
  } catch (err) { next(err); }
}

export async function deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await reviewService.deleteReview(req.params.id);
    ok(res, null, 'Avis supprimé');
  } catch (err) { next(err); }
}
