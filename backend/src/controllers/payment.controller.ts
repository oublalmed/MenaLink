import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { youcanPayService } from '../services/youcanPay.service';
import { PaymentStatus, BookingStatus } from '../../../shared/types';

const initiateSchema = z.object({ bookingId: z.string().uuid() });

/**
 * Initialise un paiement YouCan Pay pour une réservation.
 */
export async function initiatePayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bookingId } = initiateSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) throw new AppError(404, 'Réservation introuvable');
    if (booking.clientId !== req.userId) throw new AppError(403, 'Accès interdit');
    if (booking.payment?.status === PaymentStatus.PAID) throw new AppError(400, 'Déjà payé');

    const orderData = await youcanPayService.createOrder({
      amount: Number(booking.totalPrice),
      currency: 'MAD',
      orderId: bookingId,
      customerName: req.userId ?? '',
    });

    await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount: booking.totalPrice,
        currency: 'MAD',
        youcanPayOrderId: orderData.orderId,
      },
      update: { youcanPayOrderId: orderData.orderId },
    });

    sendSuccess(res, { checkoutUrl: orderData.checkoutUrl });
  } catch (err) {
    next(err);
  }
}

/**
 * Reçoit le webhook YouCan Pay et met à jour le statut du paiement.
 */
export async function handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isValid = youcanPayService.verifyWebhook(req.body, req.headers['x-youcan-signature'] as string);
    if (!isValid) throw new AppError(400, 'Signature webhook invalide');

    const { order_id, status, transaction_id } = req.body as {
      order_id: string;
      status: string;
      transaction_id: string;
    };

    const paymentStatus = status === 'paid' ? PaymentStatus.PAID : PaymentStatus.FAILED;

    await prisma.payment.update({
      where: { bookingId: order_id },
      data: {
        status: paymentStatus,
        youcanPayTransactionId: transaction_id,
        paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : undefined,
      },
    });

    if (paymentStatus === PaymentStatus.PAID) {
      await prisma.booking.update({
        where: { id: order_id },
        data: { status: BookingStatus.CONFIRMED },
      });
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

/** Retourne le paiement associé à une réservation. */
export async function getPaymentByBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { bookingId: req.params.bookingId },
    });
    if (!payment) throw new AppError(404, 'Paiement introuvable');
    sendSuccess(res, payment);
  } catch (err) {
    next(err);
  }
}
