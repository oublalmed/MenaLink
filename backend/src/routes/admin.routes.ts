import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validate';
import { paginate } from '../middleware/paginate';
import { UserRole } from '@prisma/client';
import {
  adminUserListSchema, adminUserStatusSchema, adminVerifyProviderSchema,
  adminBookingListSchema, adminResolveDisputeSchema, adminSettingSchema,
} from '../schemas/admin.schemas';

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get( '/dashboard',              ctrl.getDashboard);
router.get( '/users',                  validateQuery(adminUserListSchema),    ctrl.listUsers);
router.put( '/users/:id/status',       validateBody(adminUserStatusSchema),   ctrl.setUserStatus);
router.get( '/providers/pending',      paginate(),                            ctrl.listPendingProviders);
router.put( '/providers/:id/verify',   validateBody(adminVerifyProviderSchema), ctrl.verifyProvider);
router.get( '/bookings',               validateQuery(adminBookingListSchema), ctrl.listAllBookings);
router.get( '/transactions',           paginate(),                            ctrl.listAllTransactions);
router.get( '/disputes',               paginate(),                            ctrl.listDisputes);
router.put( '/disputes/:id',           validateBody(adminResolveDisputeSchema), ctrl.resolveDispute);
router.get( '/settings',               ctrl.getSettings);
router.put( '/settings/:key',          validateBody(adminSettingSchema),      ctrl.updateSetting);

export default router;
