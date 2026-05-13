import { UserRole, UserStatus } from '@prisma/client';

// ── Mocks ──────────────────────────────────────────────────────────────────────
jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst:  jest.fn(),
      create:     jest.fn(),
      update:     jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash:    jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

jest.mock('../../../config/firebase', () => ({
  firebaseAuth: jest.fn().mockReturnValue({ verifyIdToken: jest.fn() }),
}));

import { prisma } from '../../../config/prisma';
import bcrypt from 'bcryptjs';
import { registerClient, loginWithPassword } from '../../../services/auth.service';
import { AppError } from '../../../utils/errors';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const baseUser = {
  id: 'user-1', email: 'test@example.com', phone: '+212661000001',
  firstName: 'Test', lastName: 'User', role: UserRole.CLIENT,
  status: UserStatus.ACTIVE, avatarUrl: null, firebaseUid: null,
  createdAt: new Date(), lastLoginAt: null,
};

beforeEach(() => jest.clearAllMocks());

// ─── registerClient ───────────────────────────────────────────────────────────
describe('registerClient', () => {
  it('crée un utilisateur avec succès', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.user.create as jest.Mock).mockResolvedValue(baseUser);

    const result = await registerClient({
      email: 'test@example.com', phone: '+212661000001',
      password: 'Password1!', firstName: 'Test', lastName: 'User',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('Password1!', 12);
    expect(result).toMatchObject({ email: 'test@example.com' });
  });

  it('lève AUTH_EMAIL_TAKEN si email existe', async () => {
    (mockPrisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(baseUser) // email exists
      .mockResolvedValueOnce(null);    // phone ok

    await expect(
      registerClient({ email: 'taken@example.com', phone: '+212661999999', password: 'P1!aaaaa', firstName: 'A', lastName: 'B' }),
    ).rejects.toMatchObject({ code: 'AUTH_EMAIL_TAKEN' });
  });

  it('lève AUTH_PHONE_TAKEN si téléphone existe', async () => {
    (mockPrisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)     // email ok
      .mockResolvedValueOnce(baseUser);// phone taken

    await expect(
      registerClient({ email: 'new@example.com', phone: '+212661000001', password: 'P1!aaaaa', firstName: 'A', lastName: 'B' }),
    ).rejects.toMatchObject({ code: 'AUTH_PHONE_TAKEN' });
  });
});

// ─── loginWithPassword ────────────────────────────────────────────────────────
describe('loginWithPassword', () => {
  it('connexion réussie', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...baseUser, passwordHash: 'hashed_password',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (mockPrisma.user.update as jest.Mock).mockResolvedValue(baseUser);

    const result = await loginWithPassword({ email: 'test@example.com', password: 'Password1!' });
    expect(result).toMatchObject({ email: 'test@example.com' });
  });

  it('lève AUTH_INVALID_CREDENTIALS si mdp incorrect', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...baseUser, passwordHash: 'hashed_password',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      loginWithPassword({ email: 'test@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS' });
  });

  it('lève AUTH_INVALID_CREDENTIALS si utilisateur inexistant', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      loginWithPassword({ email: 'nobody@example.com', password: 'pass' }),
    ).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS' });
  });

  it('lève AUTH_ACCOUNT_SUSPENDED si compte suspendu', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...baseUser, status: UserStatus.SUSPENDED, passwordHash: 'hashed_password',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      loginWithPassword({ email: 'test@example.com', password: 'Password1!' }),
    ).rejects.toMatchObject({ code: 'AUTH_ACCOUNT_SUSPENDED' });
  });
});
