// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.APP_ENV !== 'production' && process.env.APP_ENV !== 'staging') globalForPrisma.prisma = prisma;
