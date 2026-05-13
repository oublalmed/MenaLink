import { PaymentStatus, BookingStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError, ErrorCode } from '../utils/errors';
import { youcanPayService } from './youcanPay.service';
import { sendPushNotification } from './notification.service';
import { firebaseDB } from '../config/firebase';

/** Initie un paiement YouCan Pay pour une réservation. */
export async function initiatePayment(bookingId: string, clientId: string) {
  const booking = await prisma.booking.findUnique({
    where:   { id: bookingId },
    include: { address: true },
  });
  if (!booking) throw AppError.notFound(ErrorCode.BOOKING_NOT_FOUND, 'Réservation introuvable');
  if (booking.clientId !== clientId) throw AppError.forbidden();
  if (booking.paymentStatus === PaymentStatus.PAID) {
    throw AppError.badRequest(ErrorCode.PAYMENT_ALREADY_PAID, 'Cette réservation est déjà payée');
  }

  let orderResult: { orderId: string; checkoutUrl: string };
  try {
    orderResult = await youcanPayService.createOrder({
      amount:       Number(booking.totalAmount),
      currency:     'MAD',
      orderId:      bookingId,
      customerName: clientId,
    });
  } catch {
    throw AppError.badRequest(ErrorCode.PAYMENT_GATEWAY_ERROR, 'Erreur lors de la création de la commande de paiement');
  }

  await prisma.transaction.upsert({
    where:  { id: bookingId }, // using bookingId as idempotency key (upsert by bookingId)
    create: {
      bookingId,
      userId:     clientId,
      type:       TransactionType.PAYMENT,
      amount:     booking.totalAmount,
      currency:   'MAD',
      status:     TransactionStatus.PENDING,
      gatewayRef: orderResult.orderId,
    },
    update: { gatewayRef: orderResult.orderId, status: TransactionStatus.PENDING },
  });

  return { checkoutUrl: orderResult.checkoutUrl, orderId: orderResult.orderId };
}

/** Traite le webhook YouCan Pay. */
export async function handleWebhook(
  payload: Record<string, unknown>,
  signature: string,
): Promise<void> {
  if (!youcanPayService.verifyWebhook(payload, signature)) {
    throw AppError.badRequest(ErrorCode.PAYMENT_GATEWAY_ERROR, 'Signature webhook invalide');
  }

  const { order_id, status, transaction_id } = payload as {
    order_id: string; status: string; transaction_id: string;
  };

  const isPaid   = status === 'paid';
  const payStatus = isPaid ? PaymentStatus.PAID : PaymentStatus.REFUNDED;

  const booking = await prisma.booking.findUnique({ where: { id: order_id } });
  if (!booking) return;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: order_id },
      data:  {
        paymentStatus: payStatus,
        status:        isPaid ? BookingStatus.CONFIRMED : booking.status,
      },
    });

    await tx.transaction.updateMany({
      where: { bookingId: order_id, type: TransactionType.PAYMENT },
      data:  {
        status:     isPaid ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
        gatewayRef: transaction_id,
        gatewayResponse: payload as never,
      },
    });

    if (isPaid) {
      // Commission et crédit prestataire en attente
      const pp = await tx.providerProfile.findFirst({ where: { userId: booking.providerId } });
      if (pp) {
        await tx.providerEarning.update({
          where: { providerId: pp.id },
          data:  {
            pendingBalance: { increment: booking.providerAmount },
            totalEarned:    { increment: booking.providerAmount },
          },
        });
        await tx.transaction.create({
          data: {
            bookingId: order_id,
            userId:    booking.providerId,
            type:      TransactionType.COMMISSION,
            amount:    booking.commission,
            currency:  'MAD',
            status:    TransactionStatus.SUCCESS,
          },
        });
      }
    }
  });

  if (isPaid) {
    await firebaseDB().ref(`bookings/${order_id}`).update({ status: BookingStatus.CONFIRMED, updatedAt: Date.now() });
    await sendPushNotification(booking.clientId, {
      title: 'Paiement confirmé',
      body:  'Votre paiement a bien été reçu.',
      data:  { bookingId: order_id, type: 'PAYMENT_SUCCESS' },
    });
  }
}

/** Rembourse une réservation (admin). */
export async function refundBooking(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw AppError.notFound(ErrorCode.BOOKING_NOT_FOUND, 'Réservation introuvable');
  if (booking.paymentStatus !== PaymentStatus.PAID) {
    throw AppError.badRequest(ErrorCode.PAYMENT_FAILED, 'La réservation n\'est pas payée');
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data:  { paymentStatus: PaymentStatus.REFUNDED },
    });
    await tx.transaction.create({
      data: {
        bookingId,
        userId:   booking.clientId,
        type:     TransactionType.REFUND,
        amount:   booking.totalAmount,
        currency: 'MAD',
        status:   TransactionStatus.SUCCESS,
      },
    });
  });

  await sendPushNotification(booking.clientId, {
    title: 'Remboursement effectué',
    body:  `Votre remboursement de ${booking.totalAmount} MAD a été initié.`,
    data:  { bookingId, type: 'PAYMENT_REFUNDED' },
  });
}

/** Historique des transactions d'un utilisateur. */
export async function getTransactionHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where:   { userId },
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: { booking: { select: { id: true, serviceType: true, scheduledDate: true } } },
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);
  return { items, total };
}
