import { Router } from 'express';
import { getProviders, getProviderById, updateProviderProfile } from '../controllers/provider.controller';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { UserRole } from '../../../shared/types';

const router = Router();

router.get('/', getProviders);
router.get('/:id', getProviderById);
router.put('/profile', authenticate, requireRole(UserRole.PROVIDER), updateProviderProfile);

export default router;
