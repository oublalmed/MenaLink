import { Router } from 'express';
import * as ctrl from '../controllers/booking.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validate';
import { paginate } from '../middleware/paginate';
import { UserRole } from '@prisma/client';
import {
  createBookingSchema, declineBookingSchema, cancelBookingSchema,
  quoteQuerySchema, bookingListQuerySchema,
} from '../schemas/booking.schemas';

const router = Router();

router.use(authenticate);

router.get( '/quote',   validateQuery(quoteQuerySchema),    ctrl.getQuote);
router.post('/',        authorize(UserRole.CLIENT),         validateBody(createBookingSchema),  ctrl.createBooking);
router.get( '/',        validateQuery(bookingListQuerySchema), ctrl.listBookings);
router.get( '/:id',     ctrl.getBooking);
router.put( '/:id/confirm',  authorize(UserRole.PROVIDER), ctrl.confirmBooking);
router.put( '/:id/decline',  authorize(UserRole.PROVIDER), validateBody(declineBookingSchema), ctrl.declineBooking);
router.put( '/:id/start',    authorize(UserRole.PROVIDER), ctrl.startBooking);
router.put( '/:id/complete', authorize(UserRole.PROVIDER), ctrl.completeBooking);
router.put( '/:id/cancel',   authorize(UserRole.CLIENT),   validateBody(cancelBookingSchema),  ctrl.cancelBooking);

export default router;
