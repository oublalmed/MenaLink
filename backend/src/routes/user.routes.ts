import { Router } from 'express';
import * as ctrl from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validate';
import { uploadSingle } from '../middleware/upload';
import { updateUserSchema } from '../schemas/user.schemas';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

router.get( '/me',          ctrl.getMe);
router.put( '/me',          validateBody(updateUserSchema), ctrl.updateMe);
router.put( '/me/avatar',   uploadSingle, ctrl.updateAvatar);
router.delete('/me',        ctrl.deleteMe);
router.patch('/me/fcm',     validateBody(z.object({ fcmToken: z.string().min(1) })), ctrl.updateFcmToken);
router.get( '/:id',         authorize(UserRole.ADMIN), ctrl.getUserById);

export default router;
