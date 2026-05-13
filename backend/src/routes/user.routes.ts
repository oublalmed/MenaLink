import { Router } from 'express';
import { updateProfile, addAddress, getAddresses, updateFcmToken } from '../controllers/user.controller';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.put('/profile', updateProfile);
router.post('/addresses', addAddress);
router.get('/addresses', getAddresses);
router.patch('/fcm-token', updateFcmToken);

export default router;
