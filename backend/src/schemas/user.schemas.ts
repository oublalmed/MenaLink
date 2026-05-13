import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().min(2).max(100).trim().optional(),
  lastName:  z.string().min(2).max(100).trim().optional(),
  phone:     z.string().regex(/^\+212[5-7]\d{8}$/).optional(),
});
