import { prisma } from '../config/prisma.js';

export type HealthStatus = {
  database: 'connected';
  status: 'ok';
};

export async function getHealthStatus(): Promise<HealthStatus> {
  await prisma.$queryRaw`SELECT 1`;
  return { status: 'ok', database: 'connected' };
}
