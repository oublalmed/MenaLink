import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import {
  registerClientSchema, registerProviderSchema, loginSchema, socialLoginSchema,
  verifyPhoneSchema, resendOtpSchema, forgotPasswordSchema, resetPasswordSchema,
  refreshTokenSchema,
} from '../schemas/auth.schemas';

const router = Router();

router.post('/register/client',   validateBody(registerClientSchema),   ctrl.registerClient);
router.post('/register/provider', validateBody(registerProviderSchema), ctrl.registerProvider);
router.post('/login',             validateBody(loginSchema),             ctrl.login);
router.post('/social-login',      validateBody(socialLoginSchema),       ctrl.socialLogin);
router.post('/refresh',           validateBody(refreshTokenSchema),      ctrl.refreshToken);
router.post('/verify-phone',      validateBody(verifyPhoneSchema),       ctrl.verifyPhone);
router.post('/resend-otp',        validateBody(resendOtpSchema),         ctrl.resendOtp);
router.post('/forgot-password',   validateBody(forgotPasswordSchema),    ctrl.forgotPassword);
router.post('/reset-password',    validateBody(resetPasswordSchema),     ctrl.resetPassword);
router.get( '/me',                authenticate,                          ctrl.getMe);

export default router;
