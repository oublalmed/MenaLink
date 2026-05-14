import request from 'supertest';
import { buildTestApp } from './setup';

const app = buildTestApp();
const BASE = '/api/v1/reviews';

describe('Reviews routes', () => {
  it('GET /reviews/:providerId returns 200 or 404', async () => {
    const res = await request(app).get(`${BASE}/some-provider-id`);
    expect([200, 404]).toContain(res.status);
  });

  it('POST /reviews returns 401 without auth', async () => {
    const res = await request(app).post(BASE).send({
      bookingId: 'some-id',
      rating: 5,
      comment: 'Excellent service',
    });
    expect(res.status).toBe(401);
  });
});
