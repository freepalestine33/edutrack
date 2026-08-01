import { Router } from 'express'
import { AttendancePolicy } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireAdmin, requireAuth, requireAuthPremium } from '../middleware/auth'
import { buildNewSubscriptionData, buildRenewalData, withPremium } from '../lib/subscription.utils'

export const subscriptionRouter = Router()

subscriptionRouter.get('/subscription-plans', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const plans = await prisma.subscriptionPlan.findMany({ where: { orgId } })
    res.json(plans)
  } catch (err) {
    console.error('Error fetching plans:', err)
    res.status(500).json({ error: 'Failed to fetch subscription plans' })
  }
})

subscriptionRouter.post('/subscription-plans', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { name, sessionsCount, price, attendancePolicy } = req.body

    if (!name || !sessionsCount || price === undefined) {
      return res.status(400).json({ error: 'Name, sessions count, and price are required' })
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        orgId,
        name,
        sessionsCount: Number(sessionsCount),
        price: Number(price),
        attendancePolicy: (attendancePolicy as AttendancePolicy) || 'PAID_ABSENCE',
      },
    })
    res.status(201).json(plan)
  } catch (err) {
    console.error('Error creating plan:', err)
    res.status(500).json({ error: 'Failed to create subscription plan' })
  }
})

subscriptionRouter.get('/subscriptions', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const subs = await prisma.subscription.findMany({
      where: { enrollment: { class: { orgId } } },
      include: { plan: true, enrollment: { include: { student: true, class: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(subs)
  } catch (err) {
    console.error('Error fetching subscriptions:', err)
    res.status(500).json({ error: 'Failed to fetch subscriptions' })
  }
})

subscriptionRouter.post('/classes/:id/subscriptions', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { enrollmentId, subscriptionId, planId, extraSessions } = req.body

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, class: { orgId } },
      select: { studentId: true, classId: true },
    })
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' })

    const isVirtualId = typeof subscriptionId === 'string' && subscriptionId.startsWith('virtual-')

    const subscription = await prisma.$transaction(async (tx) => {
      let plan = null

      if (extraSessions && Number(extraSessions) > 0) {
        plan = await tx.subscriptionPlan.create({
          data: {
            orgId,
            name: `Custom ${Number(extraSessions)} sessions`,
            sessionsCount: Number(extraSessions),
            price: 0,
            currency: 'DZD',
          },
        })
      } else if (planId) {
        plan = await tx.subscriptionPlan.findFirst({ where: { id: String(planId), orgId } })
        if (!plan) throw new Error('Plan not found')
      } else {
        throw new Error('Missing planId or extraSessions')
      }

      const existingSubscription = !isVirtualId && subscriptionId
        ? await tx.subscription.findFirst({ where: { id: subscriptionId, enrollmentId } })
        : await tx.subscription.findFirst({ where: { enrollmentId }, orderBy: { createdAt: 'desc' } })

      if (existingSubscription) {
        const renewalData = await buildRenewalData(
          { ...existingSubscription, enrollmentId },
          { id: plan.id, sessionsCount: plan.sessionsCount },
          enrollment.studentId,
          tx,
          enrollment.classId,
        )
        return tx.subscription.update({
          where: { id: existingSubscription.id },
          data: renewalData,
          include: { plan: true, enrollment: { include: { student: true } } },
        })
      } else {
        return tx.subscription.create({
          data: { enrollmentId, ...buildNewSubscriptionData({ id: plan.id, sessionsCount: plan.sessionsCount }) },
          include: { plan: true, enrollment: { include: { student: true } } },
        })
      }
    })

    res.json(subscription)
  } catch (err) {
    console.error('Error renewing/creating subscription:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update subscription' })
  }
})

subscriptionRouter.patch('/subscription-plans/:id', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const planId = String(req.params.id)
    const { name, sessionsCount, price, attendancePolicy } = req.body

    const plan = await prisma.subscriptionPlan.findFirst({ where: { id: planId, orgId } })
    if (!plan) return res.status(404).json({ error: 'Plan not found' })

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        name: typeof name === 'string' ? name : plan.name,
        sessionsCount: sessionsCount !== undefined ? Number(sessionsCount) : plan.sessionsCount,
        price: price !== undefined ? Number(price) : plan.price,
        attendancePolicy: attendancePolicy as AttendancePolicy || plan.attendancePolicy,
      },
    })

    res.json(updatedPlan)
  } catch (err) {
    console.error('Error updating plan:', err)
    res.status(500).json({ error: 'Failed to update subscription plan' })
  }
})

subscriptionRouter.delete('/subscription-plans/:id', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const planId = String(req.params.id)

    const plan = await prisma.subscriptionPlan.findFirst({ where: { id: planId, orgId } })
    if (!plan) return res.status(404).json({ error: 'Plan not found' })

    await prisma.subscriptionPlan.delete({ where: { id: planId } })
    res.json({ ok: true, deletedId: planId })
  } catch (err) {
    console.error('Error deleting plan:', err)
    res.status(500).json({ error: 'Failed to delete subscription plan' })
  }
})

// FIX: removed `(prisma as any)` — use typed prisma directly
subscriptionRouter.post('/subscription-requests', requireAuth, async (req, res) => {
  const { planId, amount, currency } = req.body
  if (!amount) return res.status(400).json({ error: 'Missing amount' })

  try {
    const reqRec = await prisma.subscriptionRequest.create({
      data: {
        orgId: req.auth!.orgId,
        userId: req.auth!.id,
        planId: planId || null,
        amount: Number(amount),
        currency: currency || 'DZD',
      },
    })
    res.status(201).json(reqRec)
  } catch (err) {
    console.error('Create subscription request failed:', err)
    res.status(500).json({ error: 'Failed to create subscription request' })
  }
})

subscriptionRouter.get('/subscription-requests', requireAdmin, async (_req, res) => {
  try {
    const list = await prisma.subscriptionRequest.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(list)
  } catch (err) {
    console.error('Error fetching subscription requests:', err)
    res.status(500).json({ error: 'Failed to fetch subscription requests' })
  }
})

subscriptionRouter.post('/subscription-requests/:id/approve', requireAdmin, async (req, res) => {
  const id = String(req.params.id)
  try {
    const requestRecord = await prisma.subscriptionRequest.findFirst({ where: { id } })
    if (!requestRecord) return res.status(404).json({ error: 'Subscription request not found' })
    if (requestRecord.status === 'APPROVED') return res.json(requestRecord)
    if (requestRecord.status !== 'PENDING') return res.status(409).json({ error: 'Only pending requests can be approved' })

    const { updated, orgAfter } = await prisma.$transaction(async (tx) => {
      const updatedReq = await tx.subscriptionRequest.update({ where: { id }, data: { status: 'APPROVED' } })
      const org = await tx.organization.findUnique({ where: { id: updatedReq.orgId } })

      if (org) {
        const now = new Date()
        const currentExpires = org.premiumExpiresAt && org.premiumExpiresAt > now ? org.premiumExpiresAt : now
        let addDays = 30
        if ((updatedReq.amount ?? 0) >= 6800 || updatedReq.planId === '1year') addDays = 365
        else if ((updatedReq.amount ?? 0) >= 4500 || updatedReq.planId === '6months') addDays = 183

        const newExpires = new Date(currentExpires.getTime() + addDays * 24 * 60 * 60 * 1000)
        await tx.organization.update({ where: { id: org.id }, data: { premiumExpiresAt: newExpires } })
        await tx.auditLog.create({
          data: {
            orgId: org.id,
            userId: updatedReq.userId,
            action: 'approve_subscription_request',
            entityType: 'SubscriptionRequest',
            entityId: updatedReq.id,
            payload: JSON.stringify({ addedDays: addDays }),
          },
        })
      }

      const freshOrg = await tx.organization.findUnique({ where: { id: updatedReq.orgId } })
      return { updated: updatedReq, orgAfter: freshOrg }
    })

    res.json({ ...updated, organization: orgAfter ? withPremium(orgAfter) : undefined })
  } catch (err) {
    console.error('Approve request failed:', err)
    res.status(500).json({ error: 'Failed to approve request' })
  }
})

// FIX: removed `(prisma as any)`
subscriptionRouter.post('/subscription-requests/:id/reject', requireAdmin, async (req, res) => {
  const id = String(req.params.id)
  const { reason } = req.body
  try {
    const requestRecord = await prisma.subscriptionRequest.findFirst({ where: { id } })
    if (!requestRecord) return res.status(404).json({ error: 'Subscription request not found' })

    const updated = await prisma.subscriptionRequest.update({
      where: { id },
      data: { status: 'REJECTED', reason: reason || null },
    })

    try {
      await prisma.auditLog.create({
        data: {
          orgId: updated.orgId,
          userId: updated.userId,
          action: 'reject_subscription_request',
          entityType: 'SubscriptionRequest',
          entityId: updated.id,
          payload: JSON.stringify({ reason }),
        },
      })
    } catch (err) {
      console.error('Audit fail:', err)
    }

    res.json(updated)
  } catch (err) {
    console.error('Reject request failed:', err)
    res.status(500).json({ error: 'Failed to reject request' })
  }
})
