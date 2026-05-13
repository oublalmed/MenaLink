import { Router } from 'express';
import { getServices, getServiceById, createService, updateService } from '../controllers/service.controller';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { UserRole } from '../../../shared/types';

const router = Router();

router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/', authenticate, requireRole(UserRole.ADMIN), createService);
router.put('/:id', authenticate, requireRole(UserRole.ADMIN), updateService);

export default router;
