import { Router } from 'express';
import { register, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.get('/me', authenticate, getMe);

export default router;
