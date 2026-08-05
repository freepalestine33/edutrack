import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuthPremium } from '../middleware/auth'
import { computeSubscriptionStatus } from '../lib/subscription.utils'
import { todayRange } from '../lib/utils'

export const attendanceRouter = Router()

attendanceRouter.get('/today-sessions', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { start, end } = todayRange()
    const sessions = await prisma.session.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        class: { orgId },
      },
      include: {
        schedule: true,
        class: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                student: true,
                subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
        },
        attendances: true,
      },
      orderBy: [{ scheduledAt: 'asc' }],
    })
    res.json(sessions)
  } catch (err) {
    console.error('Error fetching today sessions:', err)
    res.status(500).json({ error: 'Failed to fetch today sessions' })
  }
})

attendanceRouter.post('/attendance', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { sessionId, studentId, status, subscriptionId, isDropIn } = req.body

    if (!sessionId || !studentId || !status) {
      return res.status(400).json({ error: 'Session ID, Student ID, and Status are required' })
    }

    const session = await prisma.session.findFirst({
      where: { id: sessionId, class: { orgId } },
      select: { id: true, classId: true },
    })
    if (!session) {
      return res.status(404).json({ error: 'Session not found in your organization' })
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, orgId },
    })
    if (!student) {
      return res.status(404).json({ error: 'Student not found in your organization' })
    }

    const isEnrolled = await prisma.enrollment.findFirst({
      where: { studentId, classId: session.classId, status: 'ACTIVE' },
    })
    if (!isEnrolled && !isDropIn) {
      return res.status(400).json({ error: 'Student is not enrolled in this group' })
    }

    let subscription = subscriptionId
      ? await prisma.subscription.findFirst({
          where: {
            id: subscriptionId,
            enrollment: { studentId, class: { orgId } },
          },
          include: { plan: true },
        })
      : null

    if (subscriptionId && !subscription) {
      return res.status(404).json({ error: 'Subscription not found in your organization' })
    }

    const policy = subscription?.plan.attendancePolicy ?? 'PAID_ABSENCE'
    const counted = status === 'PRESENT' || (status === 'ABSENT' && policy === 'PAID_ABSENCE')

    let isUnpaid = false
    if (subscription && status === 'PRESENT' && !isDropIn) {
      // Exclude current sessionId from count when checking remaining capacity
      const usedOther = await prisma.attendance.count({
        where: {
          subscriptionId: subscription.id,
          countedTowardSubscription: true,
          NOT: { sessionId },
        },
      })
      const remainingBeforeThisSession = subscription.sessionsTotal - usedOther
      isUnpaid = remainingBeforeThisSession <= 0
    } else if (!subscription && status === 'PRESENT' && !isDropIn) {
      isUnpaid = true
    }

    const attendance = await prisma.attendance.upsert({
      where: { sessionId_studentId: { sessionId, studentId } },
      create: {
        sessionId,
        studentId,
        subscriptionId: subscription?.id,
        status,
        countedTowardSubscription: counted && !isDropIn && !isUnpaid,
        isDropIn: !!isDropIn,
        isUnpaid,
        markedById: req.auth!.id,
      },
      update: {
        status,
        countedTowardSubscription: counted && !isDropIn && !isUnpaid,
        isUnpaid,
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
