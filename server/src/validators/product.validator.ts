import { z } from 'zod';

export const productListQuerySchema = z.object({
  categoryId: z.string().trim().min(1).max(100).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
  sortBy: z.enum(['name', 'price', 'stock', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const slowMovingProductsQuerySchema = z.object({ categoryId: z.string().trim().min(1).max(100).optional() });

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type SlowMovingProductsQuery = z.infer<typeof slowMovingProductsQuerySchema>;
