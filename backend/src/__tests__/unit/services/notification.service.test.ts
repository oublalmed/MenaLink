import { AppError, ErrorCode } from '../../../utils/errors';

// Mock prisma
const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdateMany = jest.fn();
const mockFindMany = jest.fn();
const mockCount = jest.fn();
const mockTransaction = jest.fn();

jest.mock('../../../config/prisma', () => ({
  prisma: {
    notification: {
      create: (...args: unknown[]) => mockCreate(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

// Mock firebase-admin messaging
const mockSend = jest.fn();
jest.mock('../../../config/firebase', () => ({
  firebaseMessaging: () => ({ send: (...args: unknown[]) => mockSend(...args) }),
}));

import {
  sendPushNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../../../services/notification.service';

describe('notification.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------------ //
  // sendPushNotification
  // ------------------------------------------------------------------ //
  describe('sendPushNotification', () => {
    const userId = 'user-123';
    const payload = { title: 'Hello', body: 'World', data: { type: 'BOOKING' } };

    it('persists a notification record in the database', async () => {
      mockCreate.mockResolvedValue({ id: 'notif-1' });
      mockFindUnique.mockResolvedValue({ fcmToken: null });

      await sendPushNotification(userId, payload);

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          title: payload.title,
          body: payload.body,
          type: 'BOOKING',
          isRead: false,
        }),
      });
    });

    it('sends an FCM push when the user has an fcmToken', async () => {
      mockCreate.mockResolvedValue({ id: 'notif-2' });
      mockFindUnique.mockResolvedValue({ fcmToken: 'valid-fcm-token' });
      mockSend.mockResolvedValue('message-id-abc');

      await sendPushNotification(userId, payload);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'valid-fcm-token',
          notification: { title: payload.title, body: payload.body },
        }),
      );
    });

    it('does NOT call FCM send when user has no fcmToken', async () => {
      mockCreate.mockResolvedValue({ id: 'notif-3' });
      mockFindUnique.mockResolvedValue({ fcmToken: null });

      await sendPushNotification(userId, payload);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('does NOT throw even if prisma.create fails (non-fatal)', async () => {
      mockCreate.mockRejectedValue(new Error('DB error'));

      await expect(sendPushNotification(userId, payload)).resolves.toBeUndefined();
    });

    it('does NOT throw even if FCM send fails (non-fatal)', async () => {
      mockCreate.mockResolvedValue({ id: 'notif-4' });
      mockFindUnique.mockResolvedValue({ fcmToken: 'valid-token' });
      mockSend.mockRejectedValue(new Error('FCM error'));

      await expect(sendPushNotification(userId, payload)).resolves.toBeUndefined();
    });

    it('defaults type to GENERIC when data.type is absent', async () => {
      mockCreate.mockResolvedValue({ id: 'notif-5' });
      mockFindUnique.mockResolvedValue({ fcmToken: null });

      await sendPushNotification(userId, { title: 'T', body: 'B' });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'GENERIC' }),
      });
    });
  });

  // ------------------------------------------------------------------ //
  // getNotifications
  // ------------------------------------------------------------------ //
  describe('getNotifications', () => {
    const userId = 'user-456';

    it('returns paginated items and total', async () => {
      const fakeItems = [{ id: 'n1' }, { id: 'n2' }];
      mockTransaction.mockResolvedValue([fakeItems, 10]);

      const result = await getNotifications(userId, 1, 2);

      expect(result).toEqual({ items: fakeItems, total: 10 });
    });

    it('calculates skip correctly for page 2', async () => {
      mockTransaction.mockImplementation(async (ops: unknown[]) =>
        Promise.all(ops as Array<Promise<unknown>>),
      );
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getNotifications(userId, 2, 5);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5, where: { userId } }),
      );
    });

    it('orders results by createdAt descending', async () => {
      mockTransaction.mockImplementation(async (ops: unknown[]) =>
        Promise.all(ops as Array<Promise<unknown>>),
      );
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getNotifications(userId, 1, 10);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });
  });

  // ------------------------------------------------------------------ //
  // markAsRead
  // ------------------------------------------------------------------ //
  describe('markAsRead', () => {
    it('updates the notification when it belongs to the user', async () => {
      mockUpdateMany.mockResolvedValue({ count: 1 });

      await markAsRead('notif-id', 'user-id');

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: 'notif-id', userId: 'user-id' },
        data: { isRead: true },
      });
    });

    it('throws AppError NOT_FOUND when notification does not belong to user', async () => {
      mockUpdateMany.mockResolvedValue({ count: 0 });

      await expect(markAsRead('bad-id', 'user-id')).rejects.toMatchObject({
        statusCode: 404,
        code: ErrorCode.NOT_FOUND,
      });
    });
  });

  // ------------------------------------------------------------------ //
  // markAllAsRead
  // ------------------------------------------------------------------ //
  describe('markAllAsRead', () => {
    it('marks all unread notifications as read for the user', async () => {
      mockUpdateMany.mockResolvedValue({ count: 3 });

      await markAllAsRead('user-789');

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { userId: 'user-789', isRead: false },
        data: { isRead: true },
      });
    });

    it('resolves without error even when there are no unread notifications', async () => {
      mockUpdateMany.mockResolvedValue({ count: 0 });

      await expect(markAllAsRead('user-no-notifs')).resolves.toBeUndefined();
    });
  });
});
