import { Request, Response } from 'express';

/** Retourne 404 pour toute route non trouvée. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
  });
}
