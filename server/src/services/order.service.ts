import type { OrderStatus, PaymentMethod, Prisma } from '../../generated/prisma/client';
import { prisma } from '../config/prisma.js';

export type RecentOrder = {
  createdAt: string;
  customerName: string;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  region: string;
  status: OrderStatus;
  totalAmount: number;
};

export type RecentOrdersQuery = {
  endDateExclusive: Date;
  pageSize: number;
  startDate: Date;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  page: number;
  sortBy: 'createdAt' | 'totalAmount' | 'orderNumber';
  sortOrder: 'asc' | 'desc';
};
export type OrderListResult = { items: RecentOrder[]; total: number; page: number; pageSize: number };

function money(value: Prisma.Decimal): number {
  return Number(value.toFixed(2));
}

export async function getRecentOrders(query: RecentOrdersQuery): Promise<OrderListResult> {
  const where: Prisma.OrderWhereInput = { createdAt: { gte: query.startDate, lt: query.endDateExclusive }, ...(query.status ? { status: query.status } : {}), ...(query.paymentMethod ? { paymentMethod: query.paymentMethod } : {}) };
  const orderBy: Prisma.OrderOrderByWithRelationInput = { [query.sortBy]: query.sortOrder };
  const [total, orders] = await prisma.$transaction([prisma.order.count({ where }), prisma.order.findMany({
    where, orderBy, skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
    select: {
      orderNumber: true,
      status: true,
      paymentMethod: true,
      region: true,
      totalAmount: true,
      createdAt: true,
      customer: { select: { name: true } },
    },
  })]);

  return { total, page: query.page, pageSize: query.pageSize, items: orders.map((order) => ({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    region: order.region,
    totalAmount: money(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    customerName: order.customer.name,
  })) };
}
