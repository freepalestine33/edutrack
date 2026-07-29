import { PrismaClient } from '@prisma/client'

/**
 * Singleton PrismaClient – reuses the same instance across hot‑reloads
 * in development (tsx watch) and avoids connection‑pool exhaustion.
 */
const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient }

export const prisma = globalForPrisma.__prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma
}
