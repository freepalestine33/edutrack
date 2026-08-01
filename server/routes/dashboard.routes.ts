import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuthPremium } from '../middleware/auth'
import { todayRange, latestByEnrollment } from '../lib/utils'

export const dashboardRouter = Router()

// Re‑export for backward compatibility with files that still import from here
export { todayRange, latestByEnrollment }

dashboardRouter.get('/dashboard', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { start, end } = todayRange()

    const [students, active, warning, expired, revenue, expenses, groups] = await Promise.all([
      prisma.student.count({ where: { orgId } }),
      prisma.subscription.count({ where: { status: 'ACTIVE', enrollment: { class: { orgId } } } }),
      prisma.subscription.count({ where: { status: 'WARNING', enrollment: { class: { orgId } } } }),
      prisma.subscription.count({ where: { status: 'EXPIRED', enrollment: { class: { orgId } } } }),
      prisma.payment.aggregate({ where: { orgId }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { orgId }, _sum: { amount: true } }),
      prisma.class.findMany({
        where: { orgId },
        include: {
          subject: true,
          schedules: { orderBy: { dayOfWeek: 'asc' } },
          _count: { select: { enrollments: true } },
          sessions: { where: { scheduledAt: { gte: start, lte: end }, status: { in: ['in_progress', 'finished'] } }, take: 1 },
        },
        orderBy: { name: 'asc' },
      }),
    ])

    const subscriptions = await prisma.subscription.findMany({
      where: { enrollment: { class: { orgId } } },
      include: {
        plan: true,
        enrollment: { include: { student: true, class: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const latestAttentionSubscriptions = latestByEnrollment(subscriptions)
      .filter((sub) => sub.status === 'WARNING' || sub.status === 'EXPIRED')
      .sort((a, b) => a.sessionsRemaining - b.sessionsRemaining)
      .slice(0, 10)

    res.json({
      stats: {
        students,
        active,
        warning,
        expired,
        revenue: revenue._sum.amount ?? 0,
        expenses: expenses._sum.amount ?? 0,
        profit: (revenue._sum.amount ?? 0) - (expenses._sum.amount ?? 0),
      },
      groups,
      subscriptions: latestAttentionSubscriptions,
    })
  } catch (err) {
    console.error('Dashboard endpoint error:', err)
    res.status(500).json({ error: 'Failed to load dashboard data' })
  }
})
