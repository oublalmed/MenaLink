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

/**
 * @swagger
 * /auth/register/client:
 *   post:
 *     tags: [Auth]
 *     summary: Inscription client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName, phone]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: client@example.com
 *               password:
 *                 type: string
 *                 example: Password1!
 *               firstName:
 *                 type: string
 *                 example: Youssef
 *               lastName:
 *                 type: string
 *                 example: Alaoui
 *               phone:
 *                 type: string
 *                 example: '+212600000001'
 *     responses:
 *       201:
 *         description: Compte client créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/register/client',   validateBody(registerClientSchema),   ctrl.registerClient);

/**
 * @swagger
 * /auth/register/provider:
 *   post:
 *     tags: [Auth]
 *     summary: Inscription prestataire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName, phone, services]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: provider@example.com
 *               password:
 *                 type: string
 *                 example: Password1!
 *               firstName:
 *                 type: string
 *                 example: Fatima
 *               lastName:
 *                 type: string
 *                 example: Benali
 *               phone:
 *                 type: string
 *                 example: '+212600000002'
 *               services:
 *                 type: array
 *                 items: { type: string }
 *                 example: ['CLEANING', 'GARDENING']
 *     responses:
 *       201:
 *         description: Compte prestataire créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/register/provider', validateBody(registerProviderSchema), ctrl.registerProvider);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Connexion utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: client@example.com
 *               password:
 *                 type: string
 *                 example: Password1!
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *                     user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Identifiants incorrects
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/login',             validateBody(loginSchema),             ctrl.login);

router.post('/social-login',      validateBody(socialLoginSchema),       ctrl.socialLogin);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Renouveler le token d'accès
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nouveaux tokens générés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *       401:
 *         description: Refresh token invalide ou expiré
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/refresh',           validateBody(refreshTokenSchema),      ctrl.refreshToken);

router.post('/verify-phone',      validateBody(verifyPhoneSchema),       ctrl.verifyPhone);
router.post('/resend-otp',        validateBody(resendOtpSchema),         ctrl.resendOtp);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Demander la réinitialisation du mot de passe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: client@example.com
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé si le compte existe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/forgot-password',   validateBody(forgotPasswordSchema),    ctrl.forgotPassword);

router.post('/reset-password',    validateBody(resetPasswordSchema),     ctrl.resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get( '/me',                authenticate,                          ctrl.getMe);

export default router;
