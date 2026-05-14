import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '20s', target: 50 },
    { duration: '40s', target: 100 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000';

export default function () {
  const loginPayload = JSON.stringify({
    email: `user${__VU}@test.com`,
    password: 'WrongPassword',
  });

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'auth endpoint responds': (r) => r.status !== 0,
    'not server error': (r) => r.status < 500,
  });
  errorRate.add(res.status >= 500);
  sleep(0.5);
}
