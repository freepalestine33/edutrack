/**
 * Subscription business‑logic helpers.
 * Extracted from class.routes so route files stay thin.
 */
import { SubscriptionStatus, EnrollmentStatus, Prisma } from '@prisma/client'
import { prisma } from './prisma'

type DbClient = Prisma.TransactionClient | typeof prisma

// ─── Shared Prisma include for class queries ────────────────────────────────

export const classInclude = {
  subject: true,
  teacher: true,
  schedules: { orderBy: { dayOfWeek: 'asc' as const } },
  enrollments: {
    where: { status: 'ACTIVE' as EnrollmentStatus },
    include: {
      student: true,
      subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' as const }, take: 1 },
    },
  },
  _count: { select: { enrollments: true } },
}

/** Include shape for session queries (with class + enrollments). Reused in multiple routes. */
export const sessionWithClassInclude = {
  class: {
    include: {
      enrollments: {
        where: { status: 'ACTIVE' as EnrollmentStatus },
        include: {
          student: true,
          subscriptions: { orderBy: { createdAt: 'desc' as const }, take: 1, include: { plan: true } },
        },
      },
    },
  },
  attendances: true,
}

// ─── Status helpers ─────────────────────────────────────────────────────────

export function computeSubscriptionStatus(remaining: number): SubscriptionStatus {
  if (remaining <= 0) return 'EXPIRED'
  if (remaining <= 2) return 'WARNING'
  return 'ACTIVE'
}

// ─── Premium helpers ────────────────────────────────────────────────────────

/** Attach a computed `premiumActive` boolean to an org object. */
export function withPremium<T extends { premiumExpiresAt?: Date | string | null }>(org: T | null | undefined) {
  if (!org) return null
  const expires = org.premiumExpiresAt ? new Date(org.premiumExpiresAt).getTime() : 0
  return { ...org, premiumActive: expires > Date.now() }
}

// ─── Subscription data builders ─────────────────────────────────────────────

export function buildNewSubscriptionData(plan: { id: string; sessionsCount: number }) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + plan.sessionsCount * 7 * 24 * 60 * 60 * 1000)

  return {
    planId: plan.id,
    sessionsTotal: plan.sessionsCount,
    sessionsUsed: 0,
    sessionsRemaining: plan.sessionsCount,
    status: 'ACTIVE' as const,
    startsAt: now,
    expiresAt,
  }
}

/**
 * Attach any unpaid sessions from before this subscription to the newly paid
 * subscription so they reduce its available session balance.
 */
export async function attachPriorUnpaidAttendancesToSubscription(
  studentId: string,
  classId: string,
  subscriptionId: string,
  dbClient: DbClient = prisma,
) {
  const updated = await dbClient.attendance.updateMany({
    where: {
      studentId,
      subscriptionId: null,
      isUnpaid: true,
      session: { classId },
    },
    data: {
      subscriptionId,
      countedTowardSubscription: true,
      isUnpaid: false,
    },
  })

  return updated.count
}

/**
 * Build the data object for renewing / extending an existing subscription.
 *
 * BUG‑FIX: `sessionsTotal` was computed as `sessionsUsed + sessionsRemaining`
 * which double‑counts carried‑over sessions. Now it equals the new plan's
 * `sessionsCount` plus any carry‑over minus unpaid deductions.
 */
export async function buildRenewalData(
  existing: {
    id: string
    enrollmentId: string
    sessionsTotal: number
    sessionsUsed: number
    sessionsRemaining: number
    expiresAt: Date | null
  },
  plan: { id: string; sessionsCount: number },
  _studentId: string,
  dbClient: DbClient = prisma,
  _classId?: string,
) {
  // Count sessions actually used on the old subscription so far
  const oldSessionsUsed = await dbClient.attendance.count({
    where: { subscriptionId: existing.id, countedTowardSubscription: true },
  })

  // Sessions that were marked as unpaid before the subscription existed
  // must not be transferred to the renewed subscription and must not reduce
  // the balance of the new plan.
  const sessionsTotal = existing.sessionsTotal + plan.sessionsCount
  const sessionsUsed = oldSessionsUsed
  const sessionsRemaining = Math.max(0, sessionsTotal - sessionsUsed)

  const now = new Date()
  const baseExpiry =
    existing.expiresAt && new Date(existing.expiresAt) > now ? new Date(existing.expiresAt) : now
  const expiresAt = new Date(baseExpiry.getTime() + plan.sessionsCount * 7 * 24 * 60 * 60 * 1000)

  return {
    planId: plan.id,
    sessionsTotal,
    sessionsUsed,
    sessionsRemaining,
    status: computeSubscriptionStatus(sessionsRemaining),
    expiresAt,
  }
}
