import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { computeSubscriptionStatus } from '../lib/subscription.utils'
import { todayRange } from '../lib/utils'

export const attendanceRouter = Router()

attendanceRouter.get('/today-sessions', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { start, end } = todayRange()
    const sessions = await prisma.session.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        class: { orgId },
      },
      include: {
        class: {
          include: {
            enrollments: {
              include: {
                student: true,
                subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
        },
        attendances: true,
      },
      orderBy: { scheduledAt: 'asc' },
    })
    res.json(sessions)
  } catch (err) {
    console.error('Error fetching today sessions:', err)
    res.status(500).json({ error: 'Failed to fetch today sessions' })
  }
})

attendanceRouter.post('/attendance', requireAuth, async (req, res) => {
  try {
    const { sessionId, studentId, status, subscriptionId, isDropIn } = req.body

    if (!sessionId || !studentId || !status) {
      return res.status(400).json({ error: 'Session ID, Student ID, and Status are required' })
    }

    // Security: verify the session belongs to the user's organization
    const session = await prisma.session.findFirst({
      where: { id: sessionId, class: { orgId: req.auth!.orgId } },
    })
    if (!session) {
      return res.status(404).json({ error: 'Session not found in your organization' })
    }

    let subscription = subscriptionId
      ? await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { plan: true } })
      : null

    const policy = subscription?.plan.attendancePolicy ?? 'PAID_ABSENCE'
    const counted = status === 'PRESENT' || (status === 'ABSENT' && policy === 'PAID_ABSENCE')

    const attendance = await prisma.attendance.upsert({
      where: { sessionId_studentId: { sessionId, studentId } },
      create: {
        sessionId,
        studentId,
        subscriptionId: subscription?.id,
        status,
        countedTowardSubscription: counted && !isDropIn,
        isDropIn: !!isDropIn,
        markedById: req.auth!.id,
      },
      update: {
        status,
        countedTowardSubscription: counted && !isDropIn,
        markedById: req.auth!.id,
      },
    })

    // Always recalculate subscription usage whenever attendance changes
    if (subscription) {
      const used = await prisma.attendance.count({
        where: { subscriptionId: subscription.id, countedTowardSubscription: true },
      })
      const remaining = subscription.sessionsTotal - used
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          sessionsUsed: used,
          sessionsRemaining: remaining,
          status: computeSubscriptionStatus(remaining),
        },
        include: { plan: true },
      })
    }

    res.json({ attendance, subscription })
  } catch (err) {
    console.error('Error marking attendance:', err)
    res.status(500).json({ error: 'Failed to mark attendance' })
  }
})
