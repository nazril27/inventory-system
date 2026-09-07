import { z } from 'zod';

export const query = {
  query: z.object({
    name: z.string().optional(),

    category: z.string().optional(),

    page: z.coerce
      .number()
      .int()
      .positive('Require positive integer value for page')
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .positive('Require positive integer value for limit')
      .max(100, 'Maximum 100 data each request')
      .default(10),

    sortBy: z
      .string()
      .regex(
        /[a-zA-Z]+:(asc|desc)$/,
        'Require valid sortBy value e.g. field:asc or field:desc'
      )
      .optional(),
  }),
};
