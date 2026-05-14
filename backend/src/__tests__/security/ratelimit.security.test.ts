import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';

describe('Rate limiting', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(
      rateLimit({
        windowMs: 1000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
      }),
    );
    app.get('/test', (_req, res) => res.json({ ok: true }));
  });

  it('allows requests below the limit', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
    }
  });

  it('blocks requests over the limit', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).get('/test');
    }
    const res = await request(app).get('/test');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMIT');
  });

  it('sets RateLimit-Remaining header', async () => {
    const res = await request(app).get('/test');
    expect(res.headers).toHaveProperty('ratelimit-remaining');
  });
});
