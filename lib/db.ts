import { PrismaClient } from '@prisma/client';

// Proper global type extension
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Initialize Prisma Client
export const db = globalThis.prisma || new PrismaClient();

// Store in global object in development
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}