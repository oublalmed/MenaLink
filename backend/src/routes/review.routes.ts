import { Router } from 'express';
import { createReview, getProviderReviews } from '../controllers/review.controller';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { UserRole } from '../../../shared/types';

const router = Router();

router.post('/', authenticate, requireRole(UserRole.CLIENT), createReview);
router.get('/provider/:providerId', getProviderReviews);

export default router;
