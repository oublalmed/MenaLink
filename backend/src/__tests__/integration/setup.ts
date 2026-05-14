import { PrismaClient } from '@prisma/client';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from '../../middleware/errorHandler';
import { notFoundHandler } from '../../middleware/notFoundHandler';
import authRoutes from '../../routes/auth.routes';
import userRoutes from '../../routes/user.routes';
import bookingRoutes from '../../routes/booking.routes';
import providerRoutes from '../../routes/provider.routes';
import paymentRoutes from '../../routes/payment.routes';
import earningsRoutes from '../../routes/earnings.routes';
import reviewRoutes from '../../routes/review.routes';
import adminRoutes from '../../routes/admin.routes';

export const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL } },
});

export function buildTestApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const API = '/api/v1';
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use(`${API}/auth`, authRoutes);
  app.use(`${API}/users`, userRoutes);
  app.use(`${API}/bookings`, bookingRoutes);
  app.use(`${API}/providers`, providerRoutes);
  app.use(`${API}/payments`, paymentRoutes);
  app.use(`${API}/earnings`, earningsRoutes);
  app.use(`${API}/reviews`, reviewRoutes);
  app.use(`${API}/admin`, adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await testPrisma.$connect();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
