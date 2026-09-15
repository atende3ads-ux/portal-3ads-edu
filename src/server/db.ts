/**
 * Cliente Prisma único por processo.
 *
 * Em desenvolvimento o Next recarrega módulos a cada alteração; sem o cache
 * global, cada recarga abriria um novo pool de conexões.
 */

import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.NODE_ENV === 'test'
    ? process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL
    : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não configurada. Ver .env.example.');
}

const createClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
