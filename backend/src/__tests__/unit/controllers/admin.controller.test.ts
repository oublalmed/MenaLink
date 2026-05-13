import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middleware/authenticate';
import { UserRole, UserStatus } from '@prisma/client';

jest.mock('../../../services/admin.service', () => ({
  getDashboardKPIs:    jest.fn(),
  listUsers:           jest.fn(),
  setUserStatus:       jest.fn(),
  listPendingProviders: jest.fn(),
  verifyProvider:      jest.fn(),
  listAllBookings:     jest.fn(),
  listAllTransactions: jest.fn(),
  listDisputes:        jest.fn(),
  resolveDispute:      jest.fn(),
  getSettings:         jest.fn(),
  updateSetting:       jest.fn(),
}));

import * as adminService from '../../../services/admin.service';
import {
  getDashboard, listUsers, setUserStatus, getSettings,
} from '../../../controllers/admin.controller';

function adminReq(overrides = {}): AuthRequest {
  return {
    userId: 'admin-1', firebaseUid: 'fb-admin',
    userRole: UserRole.ADMIN, userStatus: UserStatus.ACTIVE,
    body: {}, params: {}, query: {},
    pagination: { page: 1, limit: 20, skip: 0 },
    validatedQuery: { page: 1, limit: 20 },
    ...overrides,
  } as unknown as AuthRequest;
}

function mockRes(): Response {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
}

const next: NextFunction = jest.fn();
beforeEach(() => jest.clearAllMocks());

describe('getDashboard', () => {
  it('retourne les KPIs', async () => {
    const kpis = { users: { total: 100 }, bookings: { total: 50 } };
    (adminService.getDashboardKPIs as jest.Mock).mockResolvedValue(kpis);

    const res = mockRes();
    await getDashboard(adminReq(), res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: kpis }));
  });
});

describe('listUsers', () => {
  it('retourne une liste paginée', async () => {
    (adminService.listUsers as jest.Mock).mockResolvedValue({ items: [], total: 0 });
    const res = mockRes();
    await listUsers(adminReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('setUserStatus', () => {
  it('met à jour le statut', async () => {
    const updated = { id: 'u1', status: UserStatus.SUSPENDED };
    (adminService.setUserStatus as jest.Mock).mockResolvedValue(updated);

    const req = adminReq({ params: { id: 'u1' }, body: { status: 'SUSPENDED' } });
    const res = mockRes();
    await setUserStatus(req as AuthRequest, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('getSettings', () => {
  it('retourne les paramètres', async () => {
    (adminService.getSettings as jest.Mock).mockResolvedValue([{ key: 'commission_rate', value: '0.15' }]);
    const res = mockRes();
    await getSettings(adminReq(), res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
