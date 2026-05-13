import { Router } from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
} from '../controllers/booking.controller';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { UserRole } from '../../../shared/types';

const router = Router();

router.use(authenticate);

router.post('/', requireRole(UserRole.CLIENT), createBooking);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.patch('/:id/status', requireRole(UserRole.PROVIDER, UserRole.ADMIN), updateBookingStatus);
router.patch('/:id/cancel', requireRole(UserRole.CLIENT), cancelBooking);

export default router;
