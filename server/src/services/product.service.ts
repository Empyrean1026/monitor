import { Prisma, ProductStatus } from '../../generated/prisma/client';
import { prisma } from '../config/prisma.js';
import type { ProductListQuery, SlowMovingProductsQuery } from '../validators/product.validator.js';

export type ProductListItem = { id: string; name: string; sku: string; categoryId: string; categoryName: string; price: number; cost: number; stock: number; reorderLevel: number; status: ProductStatus };
export type ProductListResult = { items: ProductListItem[]; page: number; pageSize: number; total: number };
export type ProductCategory = { id: string; name: string };
export type SlowMovingProduct = ProductListItem & { recentQuantity: number; stockExcess: number; rule: string };
type SlowMovingRow = { id: string; name: string; sku: string; categoryId: string; categoryName: string; price: Prisma.Decimal; cost: Prisma.Decimal; stock: number; reorderLevel: number; status: ProductStatus; recentQuantity: number | bigint };
const toMoney = (value: Prisma.Decimal): number => Number(value.toFixed(2));
const listSelect = { id: true, name: true, sku: true, categoryId: true, price: true, cost: true, stock: true, reorderLevel: true, status: true, category: { select: { name: true } } } as const;
function mapProduct(product: Prisma.ProductGetPayload<{ select: typeof listSelect }>): ProductListItem { return { id: product.id, name: product.name, sku: product.sku, categoryId: product.categoryId, categoryName: product.category.name, price: toMoney(product.price), cost: toMoney(product.cost), stock: product.stock, reorderLevel: product.reorderLevel, status: product.status }; }
export async function getProductCategories(): Promise<ProductCategory[]> { return prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }); }
export async function getProducts(query: ProductListQuery): Promise<ProductListResult> { const where: Prisma.ProductWhereInput = { ...(query.categoryId ? { categoryId: query.categoryId } : {}), ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}) }; const [total, products] = await prisma.$transaction([prisma.product.count({ where }), prisma.product.findMany({ where, select: listSelect, orderBy: { [query.sortBy]: query.sortOrder }, skip: (query.page - 1) * query.pageSize, take: query.pageSize })]); return { total, page: query.page, pageSize: query.pageSize, items: products.map(mapProduct) }; }
export async function getSlowMovingProducts(query: SlowMovingProductsQuery): Promise<SlowMovingProduct[]> { const categoryFilter = query.categoryId ? Prisma.sql`AND p."categoryId" = ${query.categoryId}` : Prisma.empty; const rows = await prisma.$queryRaw<SlowMovingRow[]>(Prisma.sql`
  SELECT p.id, p.name, p.sku, p."categoryId" AS "categoryId", c.name AS "categoryName", p.price, p.cost, p.stock, p."reorderLevel" AS "reorderLevel", p.status,
    COALESCE(SUM(CASE WHEN o."createdAt" >= NOW() - INTERVAL '30 days' THEN item.quantity ELSE 0 END), 0)::int AS "recentQuantity"
  FROM "Product" p JOIN "Category" c ON c.id = p."categoryId" LEFT JOIN "OrderItem" item ON item."productId" = p.id LEFT JOIN "Order" o ON o.id = item."orderId" AND o.status IN ('PAID','PROCESSING','SHIPPED','COMPLETED')
  WHERE p.status = 'ACTIVE' ${categoryFilter}
  GROUP BY p.id, c.name HAVING COALESCE(SUM(CASE WHEN o."createdAt" >= NOW() - INTERVAL '30 days' THEN item.quantity ELSE 0 END), 0) <= 3 AND p.stock >= p."reorderLevel" * 2
  ORDER BY "recentQuantity" ASC, p.stock DESC LIMIT 50
 `); return rows.map((row) => ({ id: row.id, name: row.name, sku: row.sku, categoryId: row.categoryId, categoryName: row.categoryName, price: toMoney(row.price), cost: toMoney(row.cost), stock: row.stock, reorderLevel: row.reorderLevel, status: row.status, recentQuantity: Number(row.recentQuantity), stockExcess: row.stock - row.reorderLevel * 2, rule: '30日間の販売数が3件以下かつ在庫が補充基準の2倍以上' })); }
