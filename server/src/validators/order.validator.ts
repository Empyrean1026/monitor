import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '../../generated/prisma/client';

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(toDate).refine((value) => !Number.isNaN(value.getTime()));

export const recentOrdersQuerySchema = z.object({
  startDate: date.optional(),
  endDate: date.optional(),
  // limit remains supported for existing callers; pageSize is the standard parameter.
  limit: z.coerce.number().int().min(1).max(100).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  page: z.coerce.number().int().min(1).default(1),
  sortBy: z.enum(['createdAt', 'totalAmount', 'orderNumber']).default('createdAt'),
  sortOrder: z.enum(['asc','desc']).default('desc'),
}).transform((input, context) => {
  const endDate = input.endDate ?? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const startDate = input.startDate ?? addDays(endDate, -29);
  if (startDate > endDate) context.addIssue({ code: 'custom', message: 'startDate must be on or before endDate', path: ['startDate'] });
  return { startDate, endDateExclusive: addDays(endDate, 1), pageSize: input.pageSize ?? input.limit ?? 10, status: input.status, paymentMethod: input.paymentMethod, page: input.page, sortBy: input.sortBy, sortOrder: input.sortOrder };
});
