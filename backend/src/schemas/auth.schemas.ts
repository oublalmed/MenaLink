import { z } from 'zod';
import { UserRole } from '@prisma/client';

const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[0-9]/, 'Au moins un chiffre');

const phoneSchema = z
  .string()
  .regex(/^\+212[5-7]\d{8}$/, 'Numéro marocain invalide (+212XXXXXXXXX)');

export const registerClientSchema = z.object({
  email:     z.string().email('Email invalide'),
  phone:     phoneSchema,
  password:  passwordSchema,
  firstName: z.string().min(2).max(100).trim(),
  lastName:  z.string().min(2).max(100).trim(),
  firebaseUid: z.string().min(1).optional(),
});

export const registerProviderSchema = registerClientSchema.extend({
  bio:          z.string().max(500).optional(),
  hourlyRateMin: z.number().positive(),
  hourlyRateMax: z.number().positive(),
}).refine((d) => d.hourlyRateMax >= d.hourlyRateMin, {
  message: 'hourlyRateMax doit être ≥ hourlyRateMin',
  path: ['hourlyRateMax'],
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const socialLoginSchema = z.object({
  firebaseToken: z.string().min(1),
  role: z.nativeEnum(UserRole).optional().default(UserRole.CLIENT),
});

export const verifyPhoneSchema = z.object({
  phone: phoneSchema,
  otp:   z.string().length(6, 'OTP doit contenir 6 chiffres').regex(/^\d{6}$/),
});

export const resendOtpSchema = z.object({ phone: phoneSchema });

export const forgotPasswordSchema = z.object({ email: z.string().email() });

export const resetPasswordSchema = z.object({
  token:    z.string().min(1),
  password: passwordSchema,
});

export const refreshTokenSchema = z.object({ refreshToken: z.string().min(1) });
