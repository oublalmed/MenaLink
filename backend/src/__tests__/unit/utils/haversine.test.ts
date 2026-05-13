import { haversineKm } from '../../../utils/haversine';

describe('haversineKm', () => {
  it('retourne 0 pour deux points identiques', () => {
    expect(haversineKm(33.59, -7.63, 33.59, -7.63)).toBeCloseTo(0, 3);
  });

  it('calcule la distance Casablanca → Rabat (~85 km)', () => {
    const dist = haversineKm(33.5992, -7.6328, 33.9871, -6.8519);
    expect(dist).toBeGreaterThan(80);
    expect(dist).toBeLessThan(95);
  });

  it('calcule une courte distance avec précision', () => {
    // ~1.1 km
    const dist = haversineKm(33.59, -7.63, 33.60, -7.63);
    expect(dist).toBeGreaterThan(1.0);
    expect(dist).toBeLessThan(1.2);
  });
});
