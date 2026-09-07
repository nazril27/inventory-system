import { z } from 'zod';
import { uuid } from './custom.validation.js';

export const getProductById = {
  params: z.object({
    id: uuid,
  }),
};

export const createProduct = {
  body: z.object({
    name: z
      .string({ message: 'Require product name' })
      .trim()
      .min(3, 'Minimum 3 characters for product name'),

    description: z.string().trim().optional(),

    price: z.coerce
      .number({ message: 'Require product price' })
      .positive('Price must be higher than 0'),

    quantityInStock: z.coerce
      .number({ message: 'Require product stock' })
      .int('Require integer')
      .nonnegative('Product stock can not negative'),

    categoryId: uuid,
  }),
};

export const updateProduct = {
  params: z.object({
    id: uuid,
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(3, 'Minimum 3 characters for product name')
        .optional(),

      description: z.string().trim().nullable().optional(),

      price: z.coerce.number().positive('Price must higher than 0').optional(),

      quantityInStock: z.coerce
        .number()
        .int('Require integer')
        .nonnegative('Product stock can not negative')
        .optional(),

      categoryId: uuid.optional(),

      userId: uuid.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Require update minimum 1 property',
    }),
};

export const deleteProduct = {
  params: z.object({
    id: uuid,
  }),
};
