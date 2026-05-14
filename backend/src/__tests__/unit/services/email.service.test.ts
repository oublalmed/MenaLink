jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

import * as emailService from '../../../services/email.service';

const USER = { firstName: 'Yasmine', lastName: 'Alami', email: 'yasmine@example.com' };
const BOOKING = {
  clientEmail: 'client@example.com', clientName: 'Mohamed', providerName: 'Khadija B.',
  serviceType: 'CLEANING', scheduledDate: '2024-06-15', scheduledTime: '09:00',
  durationHours: 2, totalAmount: 240, bookingId: 'booking-123', address: 'Casablanca',
};

describe('email.service', () => {
  it('emailWelcomeClient ne throw pas', async () => {
    await expect(emailService.emailWelcomeClient(USER)).resolves.toBeUndefined();
  });

  it('emailProviderApproved ne throw pas', async () => {
    await expect(emailService.emailProviderApproved(USER)).resolves.toBeUndefined();
  });

  it('emailProviderRejected ne throw pas', async () => {
    await expect(emailService.emailProviderRejected(USER, 'Documents invalides')).resolves.toBeUndefined();
  });

  it('emailBookingConfirmed ne throw pas', async () => {
    await expect(emailService.emailBookingConfirmed(BOOKING)).resolves.toBeUndefined();
  });

  it('emailBookingCancelled ne throw pas', async () => {
    await expect(emailService.emailBookingCancelled({ ...BOOKING, cancelledBy: 'client' })).resolves.toBeUndefined();
  });

  it('emailPaymentReceipt ne throw pas', async () => {
    await expect(emailService.emailPaymentReceipt({
      clientEmail: 'client@example.com', clientName: 'Mohamed',
      bookingId: 'booking-123', amount: 240, transactionId: 'tx-abc',
      serviceType: 'CLEANING', scheduledDate: '2024-06-15',
    })).resolves.toBeUndefined();
  });

  it('emailWithdrawalProcessed ne throw pas', async () => {
    await expect(emailService.emailWithdrawalProcessed({
      providerEmail: 'provider@example.com', providerName: 'Khadija',
      amount: 800, withdrawalId: 'wd-xyz', bankName: 'CIH', rib: 'MA64011519000001234567890',
    })).resolves.toBeUndefined();
  });
});
