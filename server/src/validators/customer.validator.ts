import { z } from 'zod';
export const customerListQuerySchema = z.object({ search: z.string().trim().min(1).max(100).optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(5).max(100).default(10) });
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
