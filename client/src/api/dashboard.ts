import { http } from './http';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { CategoryDistribution, CustomerListResult, CustomerRegion, CustomerSummary, DashboardOverview, DateRangeParams, HighValueCustomer, InventoryAlert, OrderStatusSummary, PaymentMethodSummary, ProductCategory, ProductListResult, RecentOrder, SalesTrendPoint, SlowMovingProduct, TopProduct } from '../types/dashboard';

async function get<T>(url: string, params: Record<string, string | number | undefined>): Promise<T> {
  const { data } = await http.get<ApiResponse<T>>(url, { params });
  return data.data;
}

export const getOverview = (params: DateRangeParams): Promise<DashboardOverview> => get('/dashboard/overview', params);
export const getSalesTrend = (params: DateRangeParams): Promise<SalesTrendPoint[]> => get('/analytics/sales-trend', { ...params, granularity: 'day' });
export const getCategoryDistribution = (params: DateRangeParams): Promise<CategoryDistribution[]> => get('/analytics/category-distribution', params);
export const getTopProducts = (params: DateRangeParams, limit = 5): Promise<TopProduct[]> => get('/analytics/top-products', { ...params, sortBy: 'revenue', limit });
export type OrderListParams = DateRangeParams & {
  status?: string;
  paymentMethod?: string;
  page: number;
  pageSize: number;
  sortBy: 'createdAt' | 'totalAmount' | 'orderNumber';
  sortOrder: 'asc' | 'desc';
};

export const getRecentOrders = (params: DateRangeParams): Promise<PaginatedResponse<RecentOrder>> => get('/orders', { ...params, page: 1, pageSize: 8, sortBy: 'createdAt', sortOrder: 'desc' });
export const getOrderList = (params: OrderListParams): Promise<PaginatedResponse<RecentOrder>> => get('/orders', params);
export const getOrderStatus = (params: DateRangeParams): Promise<OrderStatusSummary[]> => get('/analytics/order-status', params);
export const getPaymentMethods = (params: DateRangeParams): Promise<PaymentMethodSummary[]> => get('/analytics/payment-methods', params);
export const getCustomerRegions = (params: DateRangeParams): Promise<CustomerRegion[]> => get('/analytics/customer-regions', params);
export const getSalesTrendByGranularity = (params: DateRangeParams, granularity: 'day' | 'week' | 'month'): Promise<SalesTrendPoint[]> => get('/analytics/sales-trend', { ...params, granularity });
export const getInventoryAlerts = (params: { categoryId?: string }): Promise<InventoryAlert[]> => get('/analytics/inventory-alerts', params);
export const getSlowMovingProducts = (params: { categoryId?: string }): Promise<SlowMovingProduct[]> => get('/products/slow-moving', params);
export const getProductCategories = (): Promise<ProductCategory[]> => get('/products/categories', {});
export const getProductList = (params: { categoryId?: string; search?: string; page: number; pageSize: number; sortBy: 'name' | 'price' | 'stock' | 'createdAt'; sortOrder: 'asc' | 'desc' }): Promise<ProductListResult> => get('/products', params);
export const getCustomerSummary=():Promise<CustomerSummary>=>get('/customers/summary',{}); export const getHighValueCustomers=():Promise<HighValueCustomer[]>=>get('/customers/high-value',{}); export const getCustomerList=(params:{search?:string;page:number;pageSize:number}):Promise<CustomerListResult>=>get('/customers',params);
export const getCustomerGrowth=(params:DateRangeParams,granularity:'day'|'week'|'month'):Promise<{date:string;newCustomers:number}[]>=>get('/analytics/customer-growth',{...params,granularity});
