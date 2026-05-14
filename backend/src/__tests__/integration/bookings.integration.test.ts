import request from 'supertest';
import { buildTestApp } from './setup';

const app = buildTestApp();
const BASE = '/api/v1/bookings';

describe('Bookings routes', () => {
  describe('GET /bookings', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app).get(BASE);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /bookings', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app).post(BASE).send({});
      expect(res.status).toBe(401);
    });

    it('returns 401 for malformed token', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', 'Bearer invalid.token.here')
        .send({
          providerId: 'some-id',
          serviceType: 'CLEANING',
          scheduledDate: new Date().toISOString(),
          address: '123 Test St, Casablanca',
        });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /bookings/:id', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get(`${BASE}/non-existent-id`);
      expect(res.status).toBe(401);
    });
  });
});
