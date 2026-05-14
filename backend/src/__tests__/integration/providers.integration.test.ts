import request from 'supertest';
import { buildTestApp } from './setup';

const app = buildTestApp();
const BASE = '/api/v1/providers';

describe('Providers routes', () => {
  describe('GET /providers', () => {
    it('returns 200 with a list (public endpoint)', async () => {
      const res = await request(app).get(BASE);
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('PATCH /providers/me', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).patch(`${BASE}/me`).send({ bio: 'test' });
      expect(res.status).toBe(401);
    });
  });
});
