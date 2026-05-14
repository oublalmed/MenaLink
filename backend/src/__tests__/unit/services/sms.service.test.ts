import { sendOTP, sendBookingConfirmation, sendBookingReminder, sendProviderDecision } from '../../../services/sms.service';

// All tests run in NODE_ENV=test → SMS provider returns mock
beforeEach(() => {
  process.env.NODE_ENV = 'test';
});

const BOOKING = {
  serviceType: 'CLEANING', scheduledDate: '2024-06-15', scheduledTime: '10:00',
  durationHours: 3, providerName: 'Fatima Z.', clientName: 'Mohamed A.', totalAmount: 360,
};

describe('sms.service', () => {
  describe('sendOTP', () => {
    it('retourne status sent en mode test', async () => {
      const result = await sendOTP('+212600000001', '123456');
      expect(result.status).toBe('sent');
      expect(result.provider).toBe('mock');
    });

    it('accepte les numéros marocains commençant par 0', async () => {
      const result = await sendOTP('0600000001', '654321');
      expect(result.status).toBe('sent');
    });
  });

  describe('sendBookingConfirmation', () => {
    it('ne throw pas sur numéro valide', async () => {
      await expect(sendBookingConfirmation('+212611000000', BOOKING)).resolves.toBeUndefined();
    });
  });

  describe('sendBookingReminder', () => {
    it('ne throw pas', async () => {
      await expect(sendBookingReminder('+212611000000', BOOKING)).resolves.toBeUndefined();
    });
  });

  describe('sendProviderDecision', () => {
    it('accepted — ne throw pas', async () => {
      await expect(sendProviderDecision('+212611000000', 'accepted', BOOKING)).resolves.toBeUndefined();
    });
    it('declined — ne throw pas', async () => {
      await expect(sendProviderDecision('+212611000000', 'declined', BOOKING)).resolves.toBeUndefined();
    });
  });
});
