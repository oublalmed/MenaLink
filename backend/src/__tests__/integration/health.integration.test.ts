import request from 'supertest';
import { buildTestApp } from './setup';

const app = buildTestApp();

describe('Health check', () => {
  it('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
