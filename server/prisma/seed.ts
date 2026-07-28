import 'dotenv/config';

import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

import {
  Gender,
  MemberLevel,
  OrderStatus,
  PaymentMethod,
  PrismaClient,
  ProductStatus,
  UserRole,
} from '../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const CUSTOMER_COUNT = 1_000;
const PRODUCT_COUNT = 100;
const ORDER_COUNT = 5_000;
const TRAFFIC_DAYS = 180;

const categories = [
  ['Electronics', 'electronics'],
  ['Home & Kitchen', 'home-kitchen'],
  ['Beauty & Care', 'beauty-care'],
  ['Sports & Outdoors', 'sports-outdoors'],
  ['Fashion', 'fashion'],
  ['Books & Media', 'books-media'],
  ['Food & Beverage', 'food-beverage'],
  ['Pet Supplies', 'pet-supplies'],
] as const;

const regions = ['Tokyo', 'Osaka', 'Kanagawa', 'Aichi', 'Saitama', 'Chiba', 'Fukuoka', 'Hokkaido'] as const;

const firstNames = ['Hana', 'Yuki', 'Sora', 'Haruto', 'Mio', 'Ren', 'Aoi', 'Kaito', 'Yuna', 'Riku'];
const lastNames = ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura'];
const productPrefixes = ['Essential', 'Premium', 'Everyday', 'Smart', 'Classic', 'Compact', 'Organic', 'Pro'];
const productTypes = ['Collection', 'Set', 'Kit', 'Edition', 'Series', 'Pack', 'Model', 'Bundle'];

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)] as T;
}

function weightedPick<T>(random: () => number, values: ReadonlyArray<{ value: T; weight: number }>): T {
  const threshold = random() * values.reduce((sum, entry) => sum + entry.weight, 0);
  let cumulative = 0;

  for (const entry of values) {
    cumulative += entry.weight;
    if (threshold <= cumulative) return entry.value;
  }

  return values[values.length - 1]!.value;
}

function currency(value: number): string {
  return value.toFixed(2);
}

function chunks<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

async function main(): Promise<void> {
  const random = createRandom(20260724);
  const now = new Date();
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const categoryRows = categories.map(([name, slug], index) => ({
    id: `category-${String(index + 1).padStart(2, '0')}`,
    name,
    slug,
  }));

  const customerRows = Array.from({ length: CUSTOMER_COUNT }, (_, index) => {
    const registeredDaysAgo = Math.floor(Math.pow(random(), 0.7) * 730);
    return {
      id: `customer-${String(index + 1).padStart(4, '0')}`,
      name: `${pick(random, lastNames)} ${pick(random, firstNames)}`,
      email: `customer${String(index + 1).padStart(4, '0')}@example.com`,
      gender: weightedPick(random, [
        { value: Gender.FEMALE, weight: 48 },
        { value: Gender.MALE, weight: 48 },
        { value: Gender.NON_BINARY, weight: 2 },
        { value: Gender.UNDISCLOSED, weight: 2 },
      ]),
      age: 18 + Math.floor(Math.pow(random(), 0.8) * 52),
      region: weightedPick(random, regions.map((value, index) => ({ value, weight: [25, 15, 12, 10, 9, 9, 12, 8][index]! }))),
      memberLevel: weightedPick(random, [
        { value: MemberLevel.BRONZE, weight: 58 },
        { value: MemberLevel.SILVER, weight: 25 },
        { value: MemberLevel.GOLD, weight: 13 },
        { value: MemberLevel.PLATINUM, weight: 4 },
      ]),
      registrationDate: new Date(now.getTime() - registeredDaysAgo * 86_400_000),
    };
  });

  const productRows = Array.from({ length: PRODUCT_COUNT }, (_, index) => {
    const categoryIndex = index % categoryRows.length;
    const basePrice = 800 + categoryIndex * 500 + Math.floor(random() * 14_000);
    return {
      id: `product-${String(index + 1).padStart(3, '0')}`,
      name: `${categories[categoryIndex]![0]} ${pick(random, productPrefixes)} ${pick(random, productTypes)} ${String(index + 1).padStart(2, '0')}`,
      sku: `SKU-${String(categoryIndex + 1).padStart(2, '0')}-${String(index + 1).padStart(4, '0')}`,
      categoryId: categoryRows[categoryIndex]!.id,
      price: currency(basePrice),
      cost: currency(basePrice * (0.42 + random() * 0.18)),
      stock: index % 12 === 0 ? 2 + Math.floor(random() * 9) : 40 + Math.floor(random() * 460),
      reorderLevel: 10 + Math.floor(random() * 20),
      status: index % 41 === 0 ? ProductStatus.INACTIVE : ProductStatus.ACTIVE,
    };
  });

  const orderRows: Array<{
    id: string;
    orderNumber: string;
    customerId: string;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    subtotal: string;
    discount: string;
    totalAmount: string;
    region: string;
    createdAt: Date;
  }> = [];
  const itemRows: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    unitPrice: string;
    costAtSale: string;
    subtotal: string;
  }> = [];

  for (let index = 0; index < ORDER_COUNT; index += 1) {
    const customer = pick(random, customerRows);
    const orderId = `order-${String(index + 1).padStart(5, '0')}`;
    const uniqueProductIndexes = new Set<number>();
    const itemCount = weightedPick(random, [
      { value: 1, weight: 48 },
      { value: 2, weight: 32 },
      { value: 3, weight: 14 },
      { value: 4, weight: 6 },
    ]);

    while (uniqueProductIndexes.size < itemCount) uniqueProductIndexes.add(Math.floor(random() * productRows.length));

    let subtotal = 0;
    for (const productIndex of uniqueProductIndexes) {
      const product = productRows[productIndex]!;
      const quantity = 1 + Math.floor(Math.pow(random(), 2) * 4);
      const unitPrice = Number(product.price);
      const lineSubtotal = unitPrice * quantity;
      subtotal += lineSubtotal;
      itemRows.push({
        id: `order-item-${String(itemRows.length + 1).padStart(5, '0')}`,
        orderId,
        productId: product.id,
        quantity,
        unitPrice: currency(unitPrice),
        costAtSale: product.cost,
        subtotal: currency(lineSubtotal),
      });
    }

    const discount = random() < 0.28 ? Math.min(subtotal * (random() < 0.7 ? 0.05 : 0.1), 2_000) : 0;
    const daysAgo = Math.floor(Math.pow(random(), 1.8) * TRAFFIC_DAYS);
    const createdAt = new Date(now.getTime() - daysAgo * 86_400_000 - Math.floor(random() * 86_400_000));
    orderRows.push({
      id: orderId,
      orderNumber: `ORD-${createdAt.toISOString().slice(0, 10).replaceAll('-', '')}-${String(index + 1).padStart(5, '0')}`,
      customerId: customer.id,
      status: weightedPick(random, [
        { value: OrderStatus.COMPLETED, weight: 67 },
        { value: OrderStatus.SHIPPED, weight: 8 },
        { value: OrderStatus.PAID, weight: 5 },
        { value: OrderStatus.PROCESSING, weight: 5 },
        { value: OrderStatus.CANCELLED, weight: 7 },
        { value: OrderStatus.REFUNDED, weight: 4 },
        { value: OrderStatus.PENDING_PAYMENT, weight: 4 },
      ]),
      paymentMethod: weightedPick(random, [
        { value: PaymentMethod.CREDIT_CARD, weight: 52 },
        { value: PaymentMethod.PAYPAY, weight: 23 },
        { value: PaymentMethod.KONBINI, weight: 12 },
        { value: PaymentMethod.BANK_TRANSFER, weight: 8 },
        { value: PaymentMethod.CASH_ON_DELIVERY, weight: 5 },
      ]),
      subtotal: currency(subtotal),
      discount: currency(discount),
      totalAmount: currency(subtotal - discount),
      region: customer.region,
      createdAt,
    });
  }

  const trafficRows = Array.from({ length: TRAFFIC_DAYS }, (_, index) => {
    const visitDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (TRAFFIC_DAYS - 1 - index));
    const dayOfWeek = visitDate.getDay();
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.22 : 1;
    const uniqueVisitors = Math.round((680 + random() * 1_400) * weekendMultiplier);
    const pageViews = Math.round(uniqueVisitors * (2.2 + random() * 1.7));
    const addToCartCount = Math.round(uniqueVisitors * (0.1 + random() * 0.08));
    const checkoutCount = Math.round(addToCartCount * (0.58 + random() * 0.18));
    const orderCount = Math.round(checkoutCount * (0.68 + random() * 0.2));
    return { id: `traffic-${String(index + 1).padStart(3, '0')}`, visitDate, pageViews, uniqueVisitors, addToCartCount, checkoutCount, orderCount };
  });

  await prisma.$transaction(async (transaction) => {
    await transaction.orderItem.deleteMany();
    await transaction.order.deleteMany();
    await transaction.product.deleteMany();
    await transaction.category.deleteMany();
    await transaction.customer.deleteMany();
    await transaction.trafficRecord.deleteMany();
    await transaction.user.deleteMany();

    await transaction.user.create({
      data: {
        id: 'user-admin',
        email: 'admin@example.com',
        passwordHash,
        name: 'System Administrator',
        role: UserRole.ADMIN,
      },
    });
    await transaction.category.createMany({ data: categoryRows });
    for (const batch of chunks(customerRows, 500)) await transaction.customer.createMany({ data: batch });
    for (const batch of chunks(productRows, 500)) await transaction.product.createMany({ data: batch });
    for (const batch of chunks(orderRows, 500)) await transaction.order.createMany({ data: batch });
    for (const batch of chunks(itemRows, 500)) await transaction.orderItem.createMany({ data: batch });
    await transaction.trafficRecord.createMany({ data: trafficRows });
  }, { maxWait: 10_000, timeout: 120_000 });

  console.info(`Seeded 1 admin, ${CUSTOMER_COUNT} customers, ${PRODUCT_COUNT} products, ${ORDER_COUNT} orders, ${itemRows.length} order items, and ${TRAFFIC_DAYS} traffic records.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
