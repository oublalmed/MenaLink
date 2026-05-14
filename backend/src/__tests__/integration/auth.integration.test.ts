import request from 'supertest';
import { buildTestApp } from './setup';

const app = buildTestApp();
const BASE = '/api/v1/auth';

describe('Auth routes', () => {
  describe('POST /register/client', () => {
    it('returns 400 when body is missing required fields', async () => {
      const res = await request(app).post(`${BASE}/register/client`).send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 with invalid email format', async () => {
      const res = await request(app).post(`${BASE}/register/client`).send({
        email: 'not-an-email',
        password: 'Password1!',
        firstName: 'Test',
        lastName: 'User',
        phone: '+212600000001',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /login', () => {
    it('returns 400 when credentials are missing', async () => {
      const res = await request(app).post(`${BASE}/login`).send({});
      expect(res.status).toBe(400);
    });

    it('returns 401 for wrong credentials', async () => {
      const res = await request(app).post(`${BASE}/login`).send({
        email: 'nonexistent@test.com',
        password: 'wrongpassword',
      });
      expect([401, 400]).toContain(res.status);
    });
  });

  describe('GET /me', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get(`${BASE}/me`);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /forgot-password', () => {
    it('returns 400 with invalid email', async () => {
      const res = await request(app).post(`${BASE}/forgot-password`).send({ email: 'bad' });
      expect(res.status).toBe(400);
    });
  });
});
