import { Router } from 'express';
import * as ctrl from '../controllers/earnings.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validate';
import { paginate } from '../middleware/paginate';
import { UserRole } from '@prisma/client';
import { withdrawSchema, earningsPeriodSchema, withdrawalListQuerySchema } from '../schemas/earnings.schemas';

const router = Router();

router.use(authenticate, authorize(UserRole.PROVIDER));

router.get( '/summary',      validateQuery(earningsPeriodSchema),     ctrl.getSummary);
router.get( '/weekly',        ctrl.getWeeklyChart);
router.get( '/transactions',  paginate(),                              ctrl.getTransactions);
router.post('/withdraw',      validateBody(withdrawSchema),            ctrl.requestWithdraw);
router.get( '/withdrawals',   paginate(),                              ctrl.listWithdrawals);

export default router;
