import { z } from 'zod';
import { uuid } from './custom.validation.js';

export const createCategory = {
  body: z.object({
    name: z
      .string({ message: 'Require category name' })
      .trim()
      .min(3, 'Category name must be at least 3 characters'),
  }),
};

export const getCategoryById = {
  params: z.object({
    id: uuid,
  }),
};

export const updateCategory = {
  params: z.object({
    id: uuid,
  }),
  body: z
    .object({
      name: z
        .string({ message: 'Require category name' })
        .trim()
        .min(3, 'Category name must be at least 3 characters')
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Require update minimum 1 property',
    }),
};

export const deleteCategory = {
  params: z.object({
    id: uuid,
  }),
};
