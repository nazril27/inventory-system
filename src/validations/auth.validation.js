import { z } from 'zod';
import { password } from './custom.validation.js';

export const registerOrCreateUser = {
  body: z.object({
    name: z
      .string({ message: 'Require user name' })
      .trim()
      .min(3, 'Require minimum 3 characters for user name')
      .max(100, 'Require maximum 100 characters for user name'),

    email: z
      .string({ message: 'Require email' })
      .trim()
      .toLowerCase()
      .pipe(z.email('Required valid email format')),

    password: password,

    role: z
      .enum(['USER', 'ADMIN'], {
        errorMap: () => ({ message: 'Role must be ADMIN OR USER' }),
      })
      .optional(),
  }),
};

export const login = {
  body: z.object({
    email: z
      .string({ message: 'Require email' })
      .trim()
      .pipe(z.email('Require valid email format')),
    password: password,
  }),
};

export const refreshToken = {
  body: z.object({
    refreshToken: z.string({ message: 'Require refresh token' }).trim(),
  }),
};

export const forgotPassword = {
  body: z.object({
    email: z
      .string({ message: 'Require email' })
      .trim()
      .pipe(z.email('Require valid email format')),
  }),
};

export const resetPassword = {
  body: z.object({
    token: z.string({ message: 'Require reset password token' }).trim(),
    newPassword: password,
  }),
};
