jest.mock('../../../config/prisma', () => ({
  prisma: {
    providerProfile: { findUnique: jest.fn() },
    providerEarning: { findUnique: jest.fn(), update: jest.fn() },
    withdrawalRequest: { create: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    transaction: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), aggregate: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '../../../config/prisma';
import { requestWithdrawal } from '../../../services/earnings.service';

const mp = prisma as jest.Mocked<typeof prisma>;

const mockProfile = {
  id: 'pp1', userId: 'u1',
  earnings: { availableBalance: 500, pendingBalance: 0, totalEarned: 1000, totalWithdrawn: 500 },
};

beforeEach(() => jest.clearAllMocks());

describe('requestWithdrawal', () => {
  it('traite une demande valide', async () => {
    (mp.providerProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
    const wr = { id: 'wr1', amount: 200, status: 'PENDING' };
    (mp.$transaction as jest.Mock).mockResolvedValue([wr, {}, {}]);

    const result = await requestWithdrawal('u1', {
      amount: 200, bankAccountRib: 'MA64011519000001205000534921',
    });
    expect(result.id).toBe('wr1');
  });

  it('lève INSUFFICIENT_BALANCE si montant > disponible', async () => {
    (mp.providerProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

    await expect(
      requestWithdrawal('u1', { amount: 9999, bankAccountRib: 'MA64011519000001205000534921' }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_BALANCE' });
  });

  it('lève INSUFFICIENT_BALANCE si montant < minimum (100 MAD)', async () => {
    (mp.providerProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

    await expect(
      requestWithdrawal('u1', { amount: 50, bankAccountRib: 'MA64011519000001205000534921' }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_BALANCE' });
  });

  it('lève PROVIDER_NOT_FOUND si profil inexistant', async () => {
    (mp.providerProfile.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      requestWithdrawal('bad', { amount: 200, bankAccountRib: 'MA64011519000001205000534921' }),
    ).rejects.toMatchObject({ code: 'PROVIDER_NOT_FOUND' });
  });
});
