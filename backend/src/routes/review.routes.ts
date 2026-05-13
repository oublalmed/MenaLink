import { Router } from 'express';
import * as ctrl from '../controllers/review.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validate';
import { UserRole } from '@prisma/client';
import { createReviewSchema, reviewQuerySchema } from '../schemas/review.schemas';

const router = Router();

router.post('/',              authenticate, authorize(UserRole.CLIENT), validateBody(createReviewSchema), ctrl.createReview);
router.get( '/provider/:id',  validateQuery(reviewQuerySchema),         ctrl.getProviderReviews);
router.delete('/:id',         authenticate, authorize(UserRole.ADMIN),  ctrl.deleteReview);

export default router;
