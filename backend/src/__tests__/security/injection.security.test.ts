import request from 'supertest';
import { buildTestApp } from '../integration/setup';

const app = buildTestApp();

describe('SQL Injection protection', () => {
  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' UNION SELECT * FROM users --",
    "admin'--",
    "' OR 1=1--",
  ];

  it.each(sqlPayloads)('rejects SQL injection in login email: %s', async (payload) => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: payload, password: 'test' });
    expect(res.status).toBe(400);
    expect(res.body).not.toHaveProperty('token');
  });

  it.each(sqlPayloads)('rejects SQL injection in register: %s', async (payload) => {
    const res = await request(app)
      .post('/api/v1/auth/register/client')
      .send({
        email: payload,
        password: 'Password1!',
        firstName: 'Test',
        lastName: 'User',
        phone: '+212600000001',
      });
    expect(res.status).toBe(400);
  });
});

describe('XSS protection', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '<svg onload=alert(1)>',
  ];

  it.each(xssPayloads)('does not reflect XSS payload in response: %s', async (payload) => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: payload, password: 'test' });
    // Response should not echo back raw HTML
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('<script>');
    expect(body).not.toContain('onerror=');
    expect(res.status).toBe(400);
  });
});
