import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Réponse succès standard. */
export function ok<T>(res: Response, data: T, message?: string, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data, ...(message && { message }) });
}

/** Réponse créée (201). */
export function created<T>(res: Response, data: T, message?: string): void {
  ok(res, data, message, 201);
}

/** Réponse paginée standard. */
export function paginated<T>(
  res: Response,
  items: T[],
  meta: PaginationMeta,
  message?: string,
): void {
  res.status(200).json({
    success: true,
    data: items,
    pagination: meta,
    ...(message && { message }),
  });
}

/** Calcule les métadonnées de pagination. */
export function buildPagination(total: number, page: number, limit: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
