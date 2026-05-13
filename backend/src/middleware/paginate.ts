import { Request, Response, NextFunction } from 'express';

export interface PaginationParams {
  page:  number;
  limit: number;
  skip:  number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      pagination: PaginationParams;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validatedQuery: any;
    }
  }
}

/**
 * Extrait et normalise les paramètres de pagination depuis `req.query`.
 * Injecte `req.pagination` : { page, limit, skip }.
 */
export function paginate(defaultLimit = 10, maxLimit = 50) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const page  = Math.max(1, parseInt(String(req.query.page  ?? 1), 10) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(String(req.query.limit ?? defaultLimit), 10) || defaultLimit));
    req.pagination = { page, limit, skip: (page - 1) * limit };
    next();
  };
}
