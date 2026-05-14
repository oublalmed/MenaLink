import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { initFirebaseAdmin } from './config/firebase';
import { startSchedulers } from './services/scheduler.service';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { swaggerSpec } from './config/swagger';
import { initSentry, Sentry } from './config/sentry';
import { metricsMiddleware, createMetricsRouter } from './middleware/metrics.middleware';
import { alertingMiddleware } from './middleware/alerting.middleware';

import authRoutes         from './routes/auth.routes';
import userRoutes         from './routes/user.routes';
import providerRoutes     from './routes/provider.routes';
import bookingRoutes      from './routes/booking.routes';
import paymentRoutes      from './routes/payment.routes';
import earningsRoutes     from './routes/earnings.routes';
import reviewRoutes       from './routes/review.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes        from './routes/admin.routes';

const app        = express();
const PORT       = process.env.PORT ?? 4000;
const API_PREFIX = process.env.API_PREFIX ?? '/api/v1';

// ── Sentry ────────────────────────────────────────────────────────────────────
initSentry();

// ── Firebase Admin ────────────────────────────────────────────────────────────
initFirebaseAdmin();
startSchedulers();

// ── Sécurité & middlewares globaux ────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','),
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(compression());
app.use(metricsMiddleware);
app.use(alertingMiddleware);

// Webhook YouCan Pay — doit rester en raw/text avant express.json()
app.use(`${API_PREFIX}/payments/webhook`, express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs:        Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:             Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Trop de requêtes, réessayez dans 15 minutes.' } },
}));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const start = Date.now();
  let dbStatus: 'ok' | 'error' = 'ok';
  try {
    const { prisma } = await import('./config/prisma');
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }
  res.json({
    status: 'ok',
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    dbStatus,
    responseTime: Date.now() - start,
  });
});

// ── API Docs (dev only) ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'MenaLink API Docs',
    customCss: '.swagger-ui .topbar { background-color: #2980B9; }',
  }));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
}

// ── Prometheus metrics ────────────────────────────────────────────────────────
app.use(createMetricsRouter());

// ── Routes API ────────────────────────────────────────────────────────────────
app.use(`${API_PREFIX}/auth`,          authRoutes);
app.use(`${API_PREFIX}/users`,         userRoutes);
app.use(`${API_PREFIX}/providers`,     providerRoutes);
app.use(`${API_PREFIX}/bookings`,      bookingRoutes);
app.use(`${API_PREFIX}/payments`,      paymentRoutes);
app.use(`${API_PREFIX}/earnings`,      earningsRoutes);
app.use(`${API_PREFIX}/reviews`,       reviewRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/admin`,         adminRoutes);

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(Sentry.expressErrorHandler());
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.info(`🚀 MenaLink API — port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
  });
}

export default app;
