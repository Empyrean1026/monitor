import { z } from 'zod';

import { MemberLevel } from '../../generated/prisma/client';

function dateFromQuery(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

const dateQuery = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD date format')
  .transform(dateFromQuery)
  .refine((date) => !Number.isNaN(date.getTime()), 'Invalid calendar date');

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

const commonAnalyticsQueryInput = z.object({
  startDate: dateQuery.optional(),
  endDate: dateQuery.optional(),
  region: z.string().trim().min(1).max(100).optional(),
  categoryId: z.string().trim().min(1).max(100).optional(),
  customerLevel: z.nativeEnum(MemberLevel).optional(),
});

function normalizeAnalyticsFilters(input: z.infer<typeof commonAnalyticsQueryInput>, context: z.RefinementCtx) {
  const endDate = input.endDate ?? todayUtc();
  const startDate = input.startDate ?? addDays(endDate, -29);

  if (startDate > endDate) {
    context.addIssue({ code: 'custom', message: 'startDate must be on or before endDate', path: ['startDate'] });
  }

  return {
    ...input,
    startDate,
    endDate,
    endDateExclusive: addDays(endDate, 1),
  };
}

export const overviewQuerySchema = commonAnalyticsQueryInput.transform(normalizeAnalyticsFilters);

export const salesTrendQuerySchema = commonAnalyticsQueryInput
  .extend({ granularity: z.enum(['day', 'week', 'month']).default('day') })
  .transform((input, context) => ({ ...normalizeAnalyticsFilters(input, context), granularity: input.granularity }));

export const topProductsQuerySchema = commonAnalyticsQueryInput
  .extend({
    sortBy: z.enum(['revenue', 'quantity', 'profit']).default('revenue'),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .transform((input, context) => ({ ...normalizeAnalyticsFilters(input, context), sortBy: input.sortBy, limit: input.limit }));

export const customerGrowthQuerySchema = commonAnalyticsQueryInput
  .extend({ granularity: z.enum(['day', 'week', 'month']).default('day') })
  .transform((input, context) => ({ ...normalizeAnalyticsFilters(input, context), granularity: input.granularity }));

export const commonAnalyticsQuerySchema = commonAnalyticsQueryInput.transform(normalizeAnalyticsFilters);

export type AnalyticsFilters = z.infer<typeof overviewQuerySchema>;
export type SalesTrendQuery = z.infer<typeof salesTrendQuerySchema>;
export type TopProductsQuery = z.infer<typeof topProductsQuerySchema>;
export type CustomerGrowthQuery = z.infer<typeof customerGrowthQuerySchema>;
