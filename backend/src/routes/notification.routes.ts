import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller';
import { authenticate } from '../middleware/authenticate';
import { paginate } from '../middleware/paginate';

const router = Router();

router.use(authenticate);

router.get( '/',         paginate(),  ctrl.getNotifications);
router.put( '/read-all',             ctrl.markAllAsRead);
router.put( '/:id/read',             ctrl.markAsRead);

export default router;
