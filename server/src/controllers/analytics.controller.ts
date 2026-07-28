import type { Request, Response } from 'express';

import {
  getCategoryDistribution,
  getCustomerGrowth,
  getCustomerLevels,
  getCustomerRegions,
  getDashboardOverview,
  getInventoryAlerts,
  getOrderStatusSummary,
  getPaymentMethodSummary,
  getSalesTrend,
  getTopProducts,
} from '../services/analytics.service.js';
import { sendSuccess } from '../utils/api-response.js';
import type {
  AnalyticsFilters,
  CustomerGrowthQuery,
  SalesTrendQuery,
  TopProductsQuery,
} from '../validators/analytics.validator.js';

export async function overviewController(request: Request, response: Response): Promise<Response> {
  void request;
  const overview = await getDashboardOverview(response.locals.validatedInput as AnalyticsFilters);
  return sendSuccess(response, overview);
}

export async function salesTrendController(request: Request, response: Response): Promise<Response> {
  void request;
  const trend = await getSalesTrend(response.locals.validatedInput as SalesTrendQuery);
  return sendSuccess(response, trend);
}

export async function categoryDistributionController(request: Request, response: Response): Promise<Response> {
  void request;
  return sendSuccess(response, await getCategoryDistribution(response.locals.validatedInput as AnalyticsFilters));
}

export async function topProductsController(request: Request, response: Response): Promise<Response> {
  void request;
  return sendSuccess(response, await getTopProducts(response.locals.validatedInput as TopProductsQuery));
}

export async function orderStatusController(request: Request, response: Response): Promise<Response> {
  void request;
  return sendSuccess(response, await getOrderStatusSummary(response.locals.validatedInput as AnalyticsFilters));
}

export async function paymentMethodsController(request: Request, response: Response): Promise<Response> {
  void request;
  return sendSuccess(response, await getPaymentMethodSummary(response.locals.validatedInput as AnalyticsFilters));
}

export async function customerGrowthController(request: Request, response: Response): Promise<Response> {
  void request;
  return sendSuccess(response, await getCustomerGrowth(response.locals.validatedInput as CustomerGrowthQuery));
}

export async function customerRegionsController(request: Request, response: Response): Promise<Response> {
  void request;
  return sendSuccess(response, await getCustomerRegions(response.locals.validatedInput as AnalyticsFilters));
}

export async function customerLevelsController(request: Request, response: Response): Promise<Response> {
  void request;
  return sendSuccess(response, await getCustomerLevels(response.locals.validatedInput as AnalyticsFilters));
}

export async function inventoryAlertsController(request: Request, response: Response): Promise<Response> {
  void request;
  return sendSuccess(response, await getInventoryAlerts(response.locals.validatedInput as AnalyticsFilters));
}
