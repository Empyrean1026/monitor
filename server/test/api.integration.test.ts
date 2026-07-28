import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';

const dateRange = { startDate: '2026-07-01', endDate: '2026-07-28' };
let accessToken = '';

function authorized() {
  return { Authorization: `Bearer ${accessToken}` };
}

describe('core API integration', () => {
  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin123!' });

    expect(response.status).toBe(200);
    accessToken = response.body.data.accessToken as string;
  });

  it('authenticates the seeded administrator and never returns passwordHash', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin123!' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ accessToken: expect.any(String), user: { email: 'admin@example.com' } });
    expect(response.body.data).not.toHaveProperty('passwordHash');
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid login credentials and unauthenticated protected requests', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'wrong-password' });
    const protectedRequest = await request(app).get('/api/dashboard/overview');

    expect(login.status).toBe(401);
    expect(login.body.success).toBe(false);
    expect(protectedRequest.status).toBe(401);
    expect(protectedRequest.body.success).toBe(false);
  });

  it('validates malformed and reversed date ranges', async () => {
    const malformed = await request(app)
      .get('/api/dashboard/overview')
      .set(authorized())
      .query({ startDate: '07/01/2026', endDate: dateRange.endDate });
    const reversed = await request(app)
      .get('/api/analytics/sales-trend')
      .set(authorized())
      .query({ startDate: dateRange.endDate, endDate: dateRange.startDate, granularity: 'day' });

    expect(malformed.status).toBe(400);
    expect(reversed.status).toBe(400);
  });

  it('returns a stable zero/empty response for a range without data', async () => {
    const overview = await request(app)
      .get('/api/dashboard/overview')
      .set(authorized())
      .query({ startDate: '2035-01-01', endDate: '2035-01-31' });
    const trend = await request(app)
      .get('/api/analytics/sales-trend')
      .set(authorized())
      .query({ startDate: '2035-01-01', endDate: '2035-01-31', granularity: 'day' });

    expect(overview.status).toBe(200);
    expect(overview.body.data).toMatchObject({ totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, newCustomers: 0, conversionRate: 0 });
    expect(trend.status).toBe(200);
    expect(trend.body.data).toEqual([]);
  });

  it('returns consistent dashboard calculations and sales aggregates', async () => {
    const overview = await request(app).get('/api/dashboard/overview').set(authorized()).query(dateRange);
    const trend = await request(app).get('/api/analytics/sales-trend').set(authorized()).query({ ...dateRange, granularity: 'day' });

    expect(overview.status).toBe(200);
    expect(overview.body.data.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(overview.body.data.totalOrders).toBeGreaterThanOrEqual(0);
    expect(Math.abs(overview.body.data.averageOrderValue - (overview.body.data.totalOrders === 0 ? 0 : overview.body.data.totalRevenue / overview.body.data.totalOrders))).toBeLessThanOrEqual(0.01);
    expect(trend.status).toBe(200);
    expect(trend.body.data).toEqual(expect.any(Array));
    for (const point of trend.body.data) {
      expect(point).toMatchObject({ date: expect.any(String), revenue: expect.any(Number), orderCount: expect.any(Number), averageOrderValue: expect.any(Number) });
      expect(Math.abs(point.averageOrderValue - (point.orderCount === 0 ? 0 : point.revenue / point.orderCount))).toBeLessThanOrEqual(0.01);
    }
  });

  it('keeps category percentages bounded and summing to 100 when data exists', async () => {
    const response = await request(app).get('/api/analytics/category-distribution').set(authorized()).query(dateRange);
    expect(response.status).toBe(200);
    const categories = response.body.data as Array<{ percentage: number }>;
    expect(categories.every((item) => item.percentage >= 0 && item.percentage <= 100)).toBe(true);
    if (categories.length > 0) expect(categories.reduce((total, item) => total + item.percentage, 0)).toBeCloseTo(100, 1);
  });

  it('applies validated pagination and returns the documented response shape', async () => {
    const response = await request(app)
      .get('/api/orders')
      .set(authorized())
      .query({ ...dateRange, page: 2, pageSize: 3, sortBy: 'totalAmount', sortOrder: 'desc' });
    const invalid = await request(app).get('/api/orders').set(authorized()).query({ page: 0 });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ items: expect.any(Array), page: 2, pageSize: 3, total: expect.any(Number) });
    expect(response.body.data.items).toHaveLength(Math.min(3, Math.max(0, response.body.data.total - 3)));
    expect(invalid.status).toBe(400);
  });
});
