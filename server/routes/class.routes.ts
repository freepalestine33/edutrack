import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { todayRange } from '../lib/utils'
import {
  classInclude,
  sessionWithClassInclude,
  buildNewSubscriptionData,
  buildRenewalData,
  computeSubscriptionStatus,
} from '../lib/subscription.utils'

// Re‑export for backward compat with files that still import from here
export { classInclude, computeSubscriptionStatus, buildRenewalData, buildNewSubscriptionData }

export const classRouter = Router()

// ─── GET /classes ───────────────────────────────────────────────────────────

classRouter.get('/classes', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { start, end } = todayRange()

    const classes = await prisma.class.findMany({
      where: { orgId },
      include: {
        subject: true,
        teacher: true,
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        _count: { select: { enrollments: true } },
        sessions: { where: { scheduledAt: { gte: start, lte: end } }, take: 1 },
      },
      orderBy: { name: 'asc' },
    })
    res.json(classes)
  } catch (err) {
    console.error('Error fetching classes:', err)
    res.status(500).json({ error: 'Failed to fetch classes' })
  }
})

// ─── POST /classes ──────────────────────────────────────────────────────────

classRouter.post('/classes', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { name, subjectId, maxCapacity, level, year, section } = req.body

    const teacher = await prisma.user.findFirst({
      where: { orgId, role: { in: ['TUTOR', 'TEACHER', 'ADMIN'] } },
    })
    const subject =
      (subjectId && (await prisma.subject.findFirst({ where: { id: subjectId, orgId } }))) ||
      (await prisma.subject.findFirst({ where: { orgId } }))

    if (!teacher || !subject) return res.status(400).json({ error: 'Missing teacher or subject for organization' })

    const finalName = name?.trim() || [level, year, section].filter(Boolean).join(' - ')
    if (!finalName) {
      return res.status(400).json({ error: 'A group name (or level/year/section) is required' })
    }

    const cls = await prisma.class.create({
      data: {
        orgId,
        name: finalName,
        subjectId: subject.id,
        teacherId: teacher.id,
        maxCapacity: maxCapacity ? Number(maxCapacity) : 20,
      },
      include: classInclude,
    })
    res.status(201).json(cls)
  } catch (err) {
    console.error('Error creating class:', err)
    res.status(500).json({ error: 'Failed to create group' })
  }
})

// ─── GET /classes/:id ───────────────────────────────────────────────────────

classRouter.get('/classes/:id', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const cls = await prisma.class.findFirst({
      where: { id: String(req.params.id), orgId },
      include: classInclude,
    })
    if (!cls) return res.status(404).json({ error: 'Group not found' })

    const subs = await prisma.subscription.findMany({
      where: { enrollment: { classId: cls.id } },
      include: { plan: true, enrollment: { include: { student: true } } },
      orderBy: { sessionsRemaining: 'asc' },
    })

    res.json({ ...cls, subscriptions: subs })
  } catch (err) {
    console.error('Error getting class details:', err)
    res.status(500).json({ error: 'Failed to retrieve group' })
  }
})

// ─── POST /classes/:id/schedules (with orgId check) ─────────────────────────

classRouter.post('/classes/:id/schedules', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    // Security: verify the class belongs to the user's organization
    const cls = await prisma.class.findFirst({ where: { id: String(req.params.id), orgId } })
    if (!cls) return res.status(404).json({ error: 'Group not found in your organization' })

    const { dayOfWeek, startTime, endTime, notes, teacherId } = req.body
    const schedule = await prisma.schedule.create({
      data: {
        classId: cls.id,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        notes: notes || null,
        teacherId: teacherId || null,
      },
    })
    res.status(201).json(schedule)
  } catch (err) {
    console.error('Error creating schedule:', err)
    res.status(500).json({ error: 'Failed to create schedule' })
  }
})

// ─── DELETE /schedules/:id (with orgId check) ───────────────────────────────

classRouter.delete('/schedules/:id', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    // Security: verify the schedule belongs to the user's organization
    const schedule = await prisma.schedule.findFirst({
      where: { id: String(req.params.id), class: { orgId } },
    })
    if (!schedule) return res.status(404).json({ error: 'Schedule not found in your organization' })

    await prisma.schedule.delete({ where: { id: schedule.id } })
    res.json({ ok: true })
  } catch (err) {
    console.error('Error deleting schedule:', err)
    res.status(500).json({ error: 'Failed to delete schedule' })
  }
})

// ─── POST /classes/:id/students ─────────────────────────────────────────────

classRouter.post('/classes/:id/students', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const classId = String(req.params.id)
    const { firstName, lastName, phone, email, planId } = req.body

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' })
    }

    const cls = await prisma.class.findFirst({ where: { id: classId, orgId } })
    if (!cls) return res.status(404).json({ error: 'Group not found in your organization' })

    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: { orgId, firstName, lastName, phone: phone || null, email: email || null },
      })

      const enrollment = await tx.enrollment.create({
        data: { studentId: student.id, classId },
      })

      if (planId) {
        const plan = await tx.subscriptionPlan.findFirst({ where: { id: planId, orgId } })
        if (plan) {
          await tx.subscription.create({
            data: {
              enrollmentId: enrollment.id,
              ...buildNewSubscriptionData(plan),
            },
          })
        }
      }

      return tx.enrollment.findUnique({
        where: { id: enrollment.id },
        include: {
          student: true,
          subscriptions: { include: { plan: true } },
        },
      })
    })

    res.status(201).json(result)
  } catch (err) {
    console.error('Error adding student to class:', err)
    res.status(500).json({ error: 'Failed to add student to class' })
  }
})

// ─── GET /classes/:id/subscriptions ─────────────────────────────────────────

classRouter.get('/classes/:id/subscriptions', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: String(req.params.id), status: 'ACTIVE', class: { orgId } },
      include: {
        student: true,
        subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    const result = enrollments.map((enrollment) => {
      const latestSubs = (enrollment as any).subscriptions as any[]
      const sub = latestSubs?.[0]
      if (sub) {
        const { subscriptions: _subs, ...enrollmentRest } = enrollment as any
        return { ...sub, enrollment: { ...enrollmentRest, class: undefined } }
      }
      return {
        id: `virtual-${enrollment.id}`,
        enrollmentId: enrollment.id,
        planId: null,
        sessionsTotal: 0,
        sessionsUsed: 0,
        sessionsRemaining: 0,
        status: 'EXPIRED',
        startsAt: null,
        expiresAt: null,
        plan: null,
        enrollment: { ...enrollment, subscriptions: undefined, class: undefined },
      }
    })

    res.json(result)
  } catch (err) {
    console.error('Error fetching class subscriptions:', err)
    res.status(500).json({ error: 'Failed to fetch subscriptions' })
  }
})

// ─── GET /classes/:id/session ───────────────────────────────────────────────

classRouter.get('/classes/:id/session', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { start, end } = todayRange()
    const session = await prisma.session.findFirst({
      where: { classId: String(req.params.id), scheduledAt: { gte: start, lte: end }, class: { orgId } },
      include: sessionWithClassInclude,
    })
    res.json(session)
  } catch (err) {
    console.error('Error fetching class session:', err)
    res.status(500).json({ error: 'Failed to fetch session' })
  }
})

// ─── POST /classes/:id/session/start ────────────────────────────────────────

classRouter.post('/classes/:id/session/start', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const classId = String(req.params.id)
    const cls = await prisma.class.findFirst({ where: { id: classId, orgId } })
    if (!cls) return res.status(404).json({ error: 'Group not found in your organization' })

    const { start, end } = todayRange()

    let session = await prisma.session.findFirst({
      where: { classId, scheduledAt: { gte: start, lte: end } },
    })

    if (!session) {
      const now = new Date()
      now.setMinutes(0, 0, 0)
      session = await prisma.session.create({
        data: { classId, scheduledAt: now, status: 'in_progress' },
      })
    } else {
      session = await prisma.session.update({
        where: { id: session.id },
        data: { status: 'in_progress' },
      })
    }

    const full = await prisma.session.findUnique({
      where: { id: session.id },
      include: sessionWithClassInclude,
    })
    res.json(full)
  } catch (err) {
    console.error('Error starting session:', err)
    res.status(500).json({ error: 'Failed to start session' })
  }
})

// ─── POST /classes/:id/session/end ──────────────────────────────────────────

classRouter.post('/classes/:id/session/end', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { start, end } = todayRange()

    const session = await prisma.session.findFirst({ where: { classId: String(req.params.id), scheduledAt: { gte: start, lte: end }, class: { orgId } } })
    if (!session) return res.status(404).json({ error: 'No active session' })

    const updated = await prisma.session.update({ where: { id: session.id }, data: { status: 'finished' } })

    const full = await prisma.session.findUnique({
      where: { id: updated.id },
      include: sessionWithClassInclude,
    })
    res.json(full)
  } catch (err) {
    console.error('Error ending session:', err)
    res.status(500).json({ error: 'Failed to end session' })
  }
})

// ─── GET /classes/:id/history ───────────────────────────────────────────────

classRouter.get('/classes/:id/history', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const sessions = await prisma.session.findMany({
      where: { classId: String(req.params.id), class: { orgId } },
      include: {
        class: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE' },
              include: { student: true },
            },
          },
        },
        attendances: { include: { student: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    })
    res.json(sessions)
  } catch (err) {
    console.error('Error fetching class history:', err)
    res.status(500).json({ error: 'Failed to fetch class history' })
  }
})

// ─── GET /teachers ──────────────────────────────────────────────────────────

classRouter.get('/teachers', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const teachers = await prisma.user.findMany({
      where: { orgId, role: { in: ['TEACHER', 'ADMIN', 'TUTOR'] } },
      orderBy: { name: 'asc' },
    })
    res.json(teachers)
  } catch (err) {
    console.error('Error fetching teachers:', err)
    res.status(500).json({ error: 'Failed to fetch teachers' })
  }
})

// ─── GET /schedules ─────────────────────────────────────────────────────────

classRouter.get('/schedules', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const schedules = await prisma.schedule.findMany({
      where: { class: { orgId } },
      include: {
        class: { include: { subject: true } },
        teacher: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })
    res.json(schedules)
  } catch (err) {
    console.error('Error fetching schedules:', err)
    res.status(500).json({ error: 'Failed to fetch schedules' })
  }
})

// ─── DELETE /classes/:id ───────────────────────────────────────────────────

classRouter.delete('/classes/:id', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const classId = String(req.params.id)

    const cls = await prisma.class.findFirst({
      where: { id: classId, orgId },
    })

    if (!cls) {
      return res.status(404).json({ error: 'Group not found' })
    }

    await prisma.class.delete({
      where: { id: classId },
    })

    res.json({ success: true, deletedId: classId })
  } catch (err) {
    console.error('Error deleting class:', err)
    res.status(500).json({ error: 'Failed to delete group' })
  }
})

