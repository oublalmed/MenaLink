import { Router } from 'express';
import { getServices, getServiceById, createService, updateService } from '../controllers/service.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/',    getServices);
router.get('/:id', getServiceById);
router.post('/',   authenticate, authorize(UserRole.ADMIN), createService);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateService);

export default router;
