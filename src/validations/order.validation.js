import { z } from 'zod';
import { uuid } from './custom.validation.js';

export const createOrder = {
  body: z
    .object({
      customerName: z
        .string({ message: 'Require customer name' })
        .trim()
        .min(3, 'Require minimum 3 characters of customer name')
        .max(100, 'Require maximum 100 characters of customer name'),

      customerEmail: z
        .string()
        .trim()
        .toLowerCase()
        .email('Require valid email format')
        .or(z.literal(''))
        .transform((val) => (val === '' ? null : val))
        .optional(),

      items: z
        .array(
          z.object({
            productId: uuid,

            quantity: z
              .number({ message: 'Require product quantity' })
              .int('Require integer number')
              .positive('Require minimum 1 quantity'),
          }),
          { message: 'Require products' }
        )
        .min(1, 'Require minimum 1 product in order')
        .refine(
          (items) => {
            const productIds = items.map((item) => item.productId);
            return new Set(productIds).size === productIds.length;
          },
          { message: 'Duplicate product detected' }
        ),
    })
    .strict('Contains invalid property'),
};

export const getOrderById = {
  params: z.object({
    id: uuid,
  }),
};

export const updateOrder = {
  params: z.object({
    id: uuid,
  }),
  body: z
    .object({
      customerName: z
        .string()
        .trim()
        .min(3, 'Require minimum 3 characters of customer name')
        .max(100, 'Require maximum 100 characters of customer name')
        .optional(),

      customerEmail: z
        .string()
        .trim()
        .toLowerCase()
        .email('Require valid email format')
        .or(z.literal(''))
        .transform((val) => (val === '' ? null : val))
        .nullable()
        .optional(),

      items: z
        .array(
          z.object({
            productId: uuid,

            quantity: z
              .number({ message: 'Require product quantity' })
              .int('Require integer number')
              .positive('Require minimum 1 quantity'),
          })
        )
        .min(1, 'Require minimum 1 product in order')
        .refine(
          (items) => {
            const productIds = items.map((item) => item.productId);
            return new Set(productIds).size === productIds.length;
          },
          { message: 'Duplicate product detected' }
        )
        .optional(),

      status: z
        .enum(['PENDING', 'COMPLETED', 'CANCELLED'], {
          errorMap: () => ({
            message: 'Require one of PENDING, COMPLETED, and CANCELLED',
          }),
        })
        .optional(),
    })
    .strict('Contains invalid property')
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Require update minimum 1 property',
    }),
};

export const deleteOrder = {
  params: z.object({
    id: uuid,
  }),
};
