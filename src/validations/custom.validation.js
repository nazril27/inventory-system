import { z } from 'zod';

export const uuid = z.string().uuid({ message: 'Must be a valid UUID' });

export const password = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .refine((value) => /\d/.test(value) && /[a-zA-Z]/.test(value), {
    message: 'Password must contain at least 1 letter and 1 number',
  });
