import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const log = createLogger('alerting');

const WINDOW_MS = 60_000;
const ERROR_RATE_THRESHOLD = 0.01;
const LATENCY_THRESHOLD_MS = 500;

let windowStart = Date.now();
let totalRequests = 0;
let errorRequests = 0;

function resetWindow(): void {
  windowStart = Date.now();
  totalRequests = 0;
  errorRequests = 0;
}

export function alertingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    if (Date.now() - windowStart > WINDOW_MS) resetWindow();

    totalRequests++;
    if (res.statusCode >= 500) errorRequests++;

    if (duration > LATENCY_THRESHOLD_MS) {
      log.warn('High latency detected', {
        path: req.path,
        method: req.method,
        duration,
        statusCode: res.statusCode,
      });
    }

    if (totalRequests >= 100) {
      const errorRate = errorRequests / totalRequests;
      if (errorRate > ERROR_RATE_THRESHOLD) {
        log.error('High error rate detected', {
          errorRate: (errorRate * 100).toFixed(2) + '%',
          errorRequests,
          totalRequests,
          windowMs: WINDOW_MS,
        });
      }
    }
  });

  next();
}
