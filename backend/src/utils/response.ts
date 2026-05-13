import { Response } from 'express';

/**
 * Envoie une réponse JSON normalisée.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string): void {
  res.status(statusCode).json({ success: true, data, ...(message && { message }) });
}

/**
 * Envoie une réponse paginée normalisée.
 */
export function sendPaginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number,
): void {
  res.status(200).json({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
