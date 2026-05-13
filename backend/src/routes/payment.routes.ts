import { Router } from 'express';
import { initiatePayment, handleWebhook, getPaymentByBooking } from '../controllers/payment.controller';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/initiate', authenticate, initiatePayment);
router.post('/webhook', handleWebhook);
router.get('/booking/:bookingId', authenticate, getPaymentByBooking);

export default router;
