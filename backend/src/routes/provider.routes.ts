import { Router } from 'express';
import * as ctrl from '../controllers/provider.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validate';
import { uploadMultiple } from '../middleware/upload';
import { UserRole } from '@prisma/client';
import {
  providerListQuerySchema, nearbyQuerySchema,
  updateProviderSchema, updateLocationSchema,
} from '../schemas/provider.schemas';
import { z } from 'zod';

const router = Router();

// Routes publiques
router.get( '/',          validateQuery(providerListQuerySchema), ctrl.listProviders);
router.get( '/nearby',    validateQuery(nearbyQuerySchema),       ctrl.getNearbyProviders);
router.get( '/:id',                                               ctrl.getProviderById);
router.get( '/:id/availability',                                  ctrl.getProviderAvailability);

// Routes prestataire authentifié
router.get( '/me/stats',     authenticate, authorize(UserRole.PROVIDER),                                                        ctrl.getMyStats);
router.patch('/me',          authenticate, authorize(UserRole.PROVIDER), validateBody(z.object({ isAvailable: z.boolean().optional(), isOnline: z.boolean().optional() })), ctrl.patchProviderMe);
router.put( '/profile',      authenticate, authorize(UserRole.PROVIDER), validateBody(updateProviderSchema),                    ctrl.updateProviderProfile);
router.put( '/availability', authenticate, authorize(UserRole.PROVIDER), validateBody(z.object({ isAvailable: z.boolean() })), ctrl.updateAvailability);
router.put( '/location',     authenticate, authorize(UserRole.PROVIDER), validateBody(updateLocationSchema),                    ctrl.updateLocation);
router.post('/documents',    authenticate, authorize(UserRole.PROVIDER), uploadMultiple,                                        ctrl.uploadDocuments);

export default router;
