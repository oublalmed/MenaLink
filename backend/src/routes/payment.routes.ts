import { Router } from 'express';
import * as ctrl from '../controllers/payment.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validate';
import { paginate } from '../middleware/paginate';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const router = Router();

router.post('/webhook',              ctrl.handleWebhook); // pas d'auth — signature HMAC
router.post('/initiate',             authenticate, validateBody(z.object({ bookingId: z.string().uuid() })), ctrl.initiatePayment);
router.post('/refund/:bookingId',    authenticate, authorize(UserRole.ADMIN), ctrl.refundBooking);
router.get( '/history',              authenticate, paginate(), ctrl.getHistory);

export default router;
