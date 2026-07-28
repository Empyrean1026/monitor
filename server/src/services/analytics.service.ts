import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../config/prisma.js';
import type {
  AnalyticsFilters,
  CustomerGrowthQuery,
  SalesTrendQuery,
  TopProductsQuery,
} from '../validators/analytics.validator.js';

const REVENUE_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'] as const;

type MetricsRow = {
  totalOrders: number | bigint;
  totalRevenue: Prisma.Decimal | number | string | null;
};

type CountRow = {
  count: number | bigint;
};

type TrafficRow = {
  uniqueVisitors: number | bigint | null;
};

type TrendRow = {
  averageOrderValue: Prisma.Decimal | number | string | null;
  date: Date;
  orderCount: number | bigint;
  revenue: Prisma.Decimal | number | string | null;
};

type CategoryRow = {
  categoryId: string;
  categoryName: string;
  orderCount: number | bigint;
  revenue: Prisma.Decimal | number | string | null;
};

type ProductRow = {
  categoryName: string;
  estimatedProfit: Prisma.Decimal | number | string | null;
  productId: string;
  productName: string;
  quantitySold: number | bigint;
  revenue: Prisma.Decimal | number | string | null;
};

type StatusRow = {
  count: number | bigint;
  status: string;
};

type PaymentRow = {
  orderCount: number | bigint;
  paymentMethod: string;
  revenue: Prisma.Decimal | number | string | null;
};

type CustomerGrowthRow = {
  date: Date;
  newCustomers: number | bigint;
};

type CustomerDimensionRow = {
  dimension: string;
  revenue: Prisma.Decimal | number | string | null;
  userCount: number | bigint;
};

type InventoryRow = {
  categoryName: string;
  productId: string;
  productName: string;
  reorderLevel: number;
  sku: string;
  stock: number;
};

export type DashboardOverview = {
  averageOrderValue: number;
  conversionRate: number;
  customerGrowth: number;
  newCustomers: number;
  orderGrowth: number;
  revenueGrowth: number;
  totalOrders: number;
  totalRevenue: number;
};

export type SalesTrendPoint = {
  averageOrderValue: number;
  date: string;
  orderCount: number;
  revenue: number;
};

export type CategoryDistributionItem = {
  categoryId: string;
  categoryName: string;
  orderCount: number;
  percentage: number;
  revenue: number;
};

export type TopProduct = {
  categoryName: string;
  estimatedProfit: number;
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
};

export type OrderStatusSummary = {
  count: number;
  percentage: number;
  status: string;
};

export type PaymentMethodSummary = {
  orderCount: number;
  paymentMethod: string;
  percentage: number;
  revenue: number;
};

export type CustomerGrowthPoint = {
  date: string;
  newCustomers: number;
};

export type CustomerRegionSummary = {
  region: string;
  revenue: number;
  userCount: number;
};

export type CustomerLevelSummary = {
  averageOrderValue: number;
  memberLevel: string;
  revenue: number;
  userCount: number;
};

export type InventoryAlert = {
  categoryName: string;
  productId: string;
  productName: string;
  reorderLevel: number;
  shortfall: number;
  sku: string;
  stock: number;
};

function toNumber(value: number | bigint | Prisma.Decimal | string | null): number {
  return value === null ? 0 : Number(value);
}

function toMoney(value: number): number {
  return Number(value.toFixed(2));
}

function toPercent(value: number): number {
  return Number(value.toFixed(2));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function growth(current: number, previous: number): number {
  return previous === 0 ? 0 : toPercent(((current - previous) / previous) * 100);
}

function revenueWhere(filters: AnalyticsFilters, startDate: Date, endDateExclusive: Date): Prisma.Sql {
  const clauses: Prisma.Sql[] = [
    Prisma.sql`o."createdAt" >= ${startDate}`,
    Prisma.sql`o."createdAt" < ${endDateExclusive}`,
    Prisma.sql`o."status" IN (${Prisma.join(REVENUE_STATUSES)})`,
  ];

  if (filters.region) clauses.push(Prisma.sql`o."region" = ${filters.region}`);
  if (filters.customerLevel) clauses.push(Prisma.sql`c."memberLevel" = ${filters.customerLevel}`);
  if (filters.categoryId) clauses.push(Prisma.sql`p."categoryId" = ${filters.categoryId}`);

  return Prisma.join(clauses, ' AND ');
}

function orderWhere(filters: AnalyticsFilters, startDate: Date, endDateExclusive: Date): Prisma.Sql {
  const clauses: Prisma.Sql[] = [
    Prisma.sql`o."createdAt" >= ${startDate}`,
    Prisma.sql`o."createdAt" < ${endDateExclusive}`,
  ];

  if (filters.region) clauses.push(Prisma.sql`o."region" = ${filters.region}`);
  if (filters.customerLevel) clauses.push(Prisma.sql`c."memberLevel" = ${filters.customerLevel}`);
  if (filters.categoryId) {
    clauses.push(Prisma.sql`EXISTS (
      SELECT 1
      FROM "OrderItem" item_filter
      JOIN "Product" product_filter ON product_filter.id = item_filter."productId"
      WHERE item_filter."orderId" = o.id
        AND product_filter."categoryId" = ${filters.categoryId}
    )`);
  }

  return Prisma.join(clauses, ' AND ');
}

function customerWhere(filters: AnalyticsFilters, startDate: Date, endDateExclusive: Date): Prisma.Sql {
  const clauses: Prisma.Sql[] = [
    Prisma.sql`c."registrationDate" >= ${startDate}`,
    Prisma.sql`c."registrationDate" < ${endDateExclusive}`,
  ];

  if (filters.region) clauses.push(Prisma.sql`c."region" = ${filters.region}`);
  if (filters.customerLevel) clauses.push(Prisma.sql`c."memberLevel" = ${filters.customerLevel}`);
  if (filters.categoryId) {
    clauses.push(Prisma.sql`EXISTS (
      SELECT 1
      FROM "Order" order_filter
      JOIN "OrderItem" item_filter ON item_filter."orderId" = order_filter.id
      JOIN "Product" product_filter ON product_filter.id = item_filter."productId"
      WHERE order_filter."customerId" = c.id
        AND product_filter."categoryId" = ${filters.categoryId}
    )`);
  }

  return Prisma.join(clauses, ' AND ');
}

async function getRevenueMetrics(
  filters: AnalyticsFilters,
  startDate: Date,
  endDateExclusive: Date,
): Promise<{ totalOrders: number; totalRevenue: number }> {
  const where = revenueWhere(filters, startDate, endDateExclusive);
  const [row] = await prisma.$queryRaw<MetricsRow[]>(Prisma.sql`
    SELECT
      COUNT(DISTINCT o.id)::int AS "totalOrders",
      COALESCE(SUM(
        CASE
          WHEN o.subtotal = 0 THEN 0
          ELSE (item.subtotal / o.subtotal) * o."totalAmount"
        END
      ), 0) AS "totalRevenue"
    FROM "Order" o
    JOIN "Customer" c ON c.id = o."customerId"
    JOIN "OrderItem" item ON item."orderId" = o.id
    JOIN "Product" p ON p.id = item."productId"
    WHERE ${where}
  `);

  return {
    totalOrders: toNumber(row?.totalOrders ?? 0),
    totalRevenue: toMoney(toNumber(row?.totalRevenue ?? 0)),
  };
}

async function getNewCustomerCount(
  filters: AnalyticsFilters,
  startDate: Date,
  endDateExclusive: Date,
): Promise<number> {
  const where = customerWhere(filters, startDate, endDateExclusive);
  const [row] = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM "Customer" c
    WHERE ${where}
  `);
  return toNumber(row?.count ?? 0);
}

async function getUniqueVisitors(startDate: Date, endDateExclusive: Date): Promise<number> {
  const [row] = await prisma.$queryRaw<TrafficRow[]>(Prisma.sql`
    SELECT COALESCE(SUM("uniqueVisitors"), 0)::int AS "uniqueVisitors"
    FROM "TrafficRecord"
    WHERE "visitDate" >= ${startDate}
      AND "visitDate" < ${endDateExclusive}
  `);
  return toNumber(row?.uniqueVisitors ?? 0);
}

export async function getDashboardOverview(filters: AnalyticsFilters): Promise<DashboardOverview> {
  const durationMs = filters.endDateExclusive.getTime() - filters.startDate.getTime();
  const previousEnd = filters.startDate;
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  const [current, previous, newCustomers, previousCustomers, uniqueVisitors] = await Promise.all([
    getRevenueMetrics(filters, filters.startDate, filters.endDateExclusive),
    getRevenueMetrics(filters, previousStart, previousEnd),
    getNewCustomerCount(filters, filters.startDate, filters.endDateExclusive),
    getNewCustomerCount(filters, previousStart, previousEnd),
    getUniqueVisitors(filters.startDate, filters.endDateExclusive),
  ]);

  return {
    totalRevenue: current.totalRevenue,
    totalOrders: current.totalOrders,
    averageOrderValue: current.totalOrders === 0 ? 0 : toMoney(current.totalRevenue / current.totalOrders),
    newCustomers,
    conversionRate: uniqueVisitors === 0 ? 0 : toPercent((current.totalOrders / uniqueVisitors) * 100),
    revenueGrowth: growth(current.totalRevenue, previous.totalRevenue),
    orderGrowth: growth(current.totalOrders, previous.totalOrders),
    customerGrowth: growth(newCustomers, previousCustomers),
  };
}

export async function getSalesTrend(query: SalesTrendQuery): Promise<SalesTrendPoint[]> {
  const where = revenueWhere(query, query.startDate, query.endDateExclusive);
  const truncation = Prisma.raw(`'${query.granularity}'`);
  const rows = await prisma.$queryRaw<TrendRow[]>(Prisma.sql`
    SELECT
      date_trunc(${truncation}, o."createdAt") AS date,
      COALESCE(SUM(
        CASE
          WHEN o.subtotal = 0 THEN 0
          ELSE (item.subtotal / o.subtotal) * o."totalAmount"
        END
      ), 0) AS revenue,
      COUNT(DISTINCT o.id)::int AS "orderCount",
      COALESCE(SUM(
        CASE
          WHEN o.subtotal = 0 THEN 0
          ELSE (item.subtotal / o.subtotal) * o."totalAmount"
        END
      ) / NULLIF(COUNT(DISTINCT o.id), 0), 0) AS "averageOrderValue"
    FROM "Order" o
    JOIN "Customer" c ON c.id = o."customerId"
    JOIN "OrderItem" item ON item."orderId" = o.id
    JOIN "Product" p ON p.id = item."productId"
    WHERE ${where}
    GROUP BY date
    ORDER BY date ASC
  `);

  return rows.map((row) => ({
    date: formatDate(row.date),
    revenue: toMoney(toNumber(row.revenue)),
    orderCount: toNumber(row.orderCount),
    averageOrderValue: toMoney(toNumber(row.averageOrderValue)),
  }));
}

export async function getCategoryDistribution(filters: AnalyticsFilters): Promise<CategoryDistributionItem[]> {
  const where = revenueWhere(filters, filters.startDate, filters.endDateExclusive);
  const rows = await prisma.$queryRaw<CategoryRow[]>(Prisma.sql`
    SELECT
      category.id AS "categoryId",
      category.name AS "categoryName",
      COUNT(DISTINCT o.id)::int AS "orderCount",
      COALESCE(SUM(CASE WHEN o.subtotal = 0 THEN 0 ELSE (item.subtotal / o.subtotal) * o."totalAmount" END), 0) AS revenue
    FROM "Order" o
    JOIN "Customer" c ON c.id = o."customerId"
    JOIN "OrderItem" item ON item."orderId" = o.id
    JOIN "Product" p ON p.id = item."productId"
    JOIN "Category" category ON category.id = p."categoryId"
    WHERE ${where}
    GROUP BY category.id, category.name
    ORDER BY revenue DESC
  `);
  const totalRevenue = rows.reduce((sum, row) => sum + toNumber(row.revenue), 0);

  return rows.map((row) => ({
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    orderCount: toNumber(row.orderCount),
    revenue: toMoney(toNumber(row.revenue)),
    percentage: totalRevenue === 0 ? 0 : toPercent((toNumber(row.revenue) / totalRevenue) * 100),
  }));
}

export async function getTopProducts(query: TopProductsQuery): Promise<TopProduct[]> {
  const where = revenueWhere(query, query.startDate, query.endDateExclusive);
  const sortColumn = Prisma.raw(
    query.sortBy === 'quantity' ? '"quantitySold"' : query.sortBy === 'profit' ? '"estimatedProfit"' : 'revenue',
  );
  const rows = await prisma.$queryRaw<ProductRow[]>(Prisma.sql`
    SELECT
      p.id AS "productId",
      p.name AS "productName",
      category.name AS "categoryName",
      SUM(item.quantity)::int AS "quantitySold",
      COALESCE(SUM(CASE WHEN o.subtotal = 0 THEN 0 ELSE (item.subtotal / o.subtotal) * o."totalAmount" END), 0) AS revenue,
      COALESCE(SUM(
        (CASE WHEN o.subtotal = 0 THEN 0 ELSE (item.subtotal / o.subtotal) * o."totalAmount" END)
        - item."costAtSale" * item.quantity
      ), 0) AS "estimatedProfit"
    FROM "Order" o
    JOIN "Customer" c ON c.id = o."customerId"
    JOIN "OrderItem" item ON item."orderId" = o.id
    JOIN "Product" p ON p.id = item."productId"
    JOIN "Category" category ON category.id = p."categoryId"
    WHERE ${where}
    GROUP BY p.id, p.name, category.name
    ORDER BY ${sortColumn} DESC, p.name ASC
    LIMIT ${query.limit}
  `);

  return rows.map((row) => ({
    productId: row.productId,
    productName: row.productName,
    categoryName: row.categoryName,
    quantitySold: toNumber(row.quantitySold),
    revenue: toMoney(toNumber(row.revenue)),
    estimatedProfit: toMoney(toNumber(row.estimatedProfit)),
  }));
}

export async function getOrderStatusSummary(filters: AnalyticsFilters): Promise<OrderStatusSummary[]> {
  const where = orderWhere(filters, filters.startDate, filters.endDateExclusive);
  const rows = await prisma.$queryRaw<StatusRow[]>(Prisma.sql`
    SELECT o.status::text AS status, COUNT(*)::int AS count
    FROM "Order" o
    JOIN "Customer" c ON c.id = o."customerId"
    WHERE ${where}
    GROUP BY o.status
    ORDER BY count DESC, status ASC
  `);
  const total = rows.reduce((sum, row) => sum + toNumber(row.count), 0);

  return rows.map((row) => ({
    status: row.status,
    count: toNumber(row.count),
    percentage: total === 0 ? 0 : toPercent((toNumber(row.count) / total) * 100),
  }));
}

export async function getPaymentMethodSummary(filters: AnalyticsFilters): Promise<PaymentMethodSummary[]> {
  const where = revenueWhere(filters, filters.startDate, filters.endDateExclusive);
  const rows = await prisma.$queryRaw<PaymentRow[]>(Prisma.sql`
    SELECT
      o."paymentMethod"::text AS "paymentMethod",
      COUNT(DISTINCT o.id)::int AS "orderCount",
      COALESCE(SUM(CASE WHEN o.subtotal = 0 THEN 0 ELSE (item.subtotal / o.subtotal) * o."totalAmount" END), 0) AS revenue
    FROM "Order" o
    JOIN "Customer" c ON c.id = o."customerId"
    JOIN "OrderItem" item ON item."orderId" = o.id
    JOIN "Product" p ON p.id = item."productId"
    WHERE ${where}
    GROUP BY o."paymentMethod"
    ORDER BY revenue DESC
  `);
  const totalOrders = rows.reduce((sum, row) => sum + toNumber(row.orderCount), 0);

  return rows.map((row) => ({
    paymentMethod: row.paymentMethod,
    orderCount: toNumber(row.orderCount),
    revenue: toMoney(toNumber(row.revenue)),
    percentage: totalOrders === 0 ? 0 : toPercent((toNumber(row.orderCount) / totalOrders) * 100),
  }));
}

export async function getCustomerGrowth(query: CustomerGrowthQuery): Promise<CustomerGrowthPoint[]> {
  const where = customerWhere(query, query.startDate, query.endDateExclusive);
  const truncation = Prisma.raw(`'${query.granularity}'`);
  const rows = await prisma.$queryRaw<CustomerGrowthRow[]>(Prisma.sql`
    SELECT date_trunc(${truncation}, c."registrationDate") AS date, COUNT(*)::int AS "newCustomers"
    FROM "Customer" c
    WHERE ${where}
    GROUP BY date
    ORDER BY date ASC
  `);

  return rows.map((row) => ({ date: formatDate(row.date), newCustomers: toNumber(row.newCustomers) }));
}

async function getCustomerDimensionSummary(
  filters: AnalyticsFilters,
  dimensionSql: Prisma.Sql,
): Promise<CustomerDimensionRow[]> {
  const customerFilter = customerWhere(filters, filters.startDate, filters.endDateExclusive);
  const revenueFilter = revenueWhere(filters, filters.startDate, filters.endDateExclusive);
  return prisma.$queryRaw<CustomerDimensionRow[]>(Prisma.sql`
    WITH order_revenue AS (
      SELECT
        o."customerId" AS "customerId",
        COALESCE(SUM(CASE WHEN o.subtotal = 0 THEN 0 ELSE (item.subtotal / o.subtotal) * o."totalAmount" END), 0) AS revenue
      FROM "Order" o
      JOIN "Customer" c ON c.id = o."customerId"
      JOIN "OrderItem" item ON item."orderId" = o.id
      JOIN "Product" p ON p.id = item."productId"
      WHERE ${revenueFilter}
      GROUP BY o."customerId"
    )
    SELECT
      ${dimensionSql} AS dimension,
      COUNT(c.id)::int AS "userCount",
      COALESCE(SUM(order_revenue.revenue), 0) AS revenue
    FROM "Customer" c
    LEFT JOIN order_revenue ON order_revenue."customerId" = c.id
    WHERE ${customerFilter}
    GROUP BY dimension
    ORDER BY revenue DESC, dimension ASC
  `);
}

export async function getCustomerRegions(filters: AnalyticsFilters): Promise<CustomerRegionSummary[]> {
  const rows = await getCustomerDimensionSummary(filters, Prisma.raw('c.region'));
  return rows.map((row) => ({
    region: row.dimension,
    userCount: toNumber(row.userCount),
    revenue: toMoney(toNumber(row.revenue)),
  }));
}

export async function getCustomerLevels(filters: AnalyticsFilters): Promise<CustomerLevelSummary[]> {
  const rows = await getCustomerDimensionSummary(filters, Prisma.raw('c."memberLevel"::text'));
  return rows.map((row) => {
    const userCount = toNumber(row.userCount);
    const revenue = toMoney(toNumber(row.revenue));
    return {
      memberLevel: row.dimension,
      userCount,
      revenue,
      averageOrderValue: userCount === 0 ? 0 : toMoney(revenue / userCount),
    };
  });
}

export async function getInventoryAlerts(filters: AnalyticsFilters): Promise<InventoryAlert[]> {
  const categoryFilter = filters.categoryId ? Prisma.sql`AND p."categoryId" = ${filters.categoryId}` : Prisma.empty;
  const rows = await prisma.$queryRaw<InventoryRow[]>(Prisma.sql`
    SELECT
      p.id AS "productId",
      p.name AS "productName",
      p.sku,
      p.stock,
      p."reorderLevel" AS "reorderLevel",
      category.name AS "categoryName"
    FROM "Product" p
    JOIN "Category" category ON category.id = p."categoryId"
    WHERE p.stock < p."reorderLevel"
      AND p.status = 'ACTIVE'
      ${categoryFilter}
    ORDER BY p.stock ASC, p.name ASC
  `);

  return rows.map((row) => ({
    productId: row.productId,
    productName: row.productName,
    sku: row.sku,
    categoryName: row.categoryName,
    stock: row.stock,
    reorderLevel: row.reorderLevel,
    shortfall: row.reorderLevel - row.stock,
  }));
}
