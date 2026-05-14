import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m',  target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000';

export default function () {
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, { 'health status 200': (r) => r.status === 200 });
  errorRate.add(healthRes.status !== 200);
  responseTime.add(healthRes.timings.duration);
  sleep(0.1);

  const providersRes = http.get(`${BASE_URL}/api/v1/providers?page=1&limit=10`);
  check(providersRes, {
    'providers status 200': (r) => r.status === 200,
    'providers response < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(providersRes.status !== 200);
  responseTime.add(providersRes.timings.duration);
  sleep(0.2);
}
