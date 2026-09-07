import { z } from 'zod';
import { password, uuid } from './custom.validation.js';

export const getUserById = {
  params: z.object({
    id: uuid,
  }),
};

export const getUserByEmail = {
  body: z.object({
    email: z
      .string({ message: 'Require email' })
      .trim()
      .toLowerCase()
      .pipe(z.email('Required valid email format')),
  }),
};

export const updateUser = {
  params: z.object({
    id: uuid,
  }),
  body: z
    .object({
      name: z
        .string({ message: 'Require user name' })
        .trim()
        .min(3, 'Require minimum 3 characters for user name')
        .max(100, 'Require maximum 100 characters for user name')
        .optional(),

      email: z
        .string({ message: 'Require email' })
        .trim()
        .toLowerCase()
        .pipe(z.email('Required valid email format'))
        .optional(),

      password: password.optional(),

      role: z
        .enum(['USER', 'ADMIN'], {
          errorMap: () => ({ message: 'Role must be ADMIN OR USER' }),
        })
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Require update minimum 1 property',
    }),
};

export const deleteUser = {
  params: z.object({
    id: uuid,
  }),
};
