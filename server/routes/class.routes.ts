import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuthPremium, publicUserSelect } from '../middleware/auth'
import { todayRange } from '../lib/utils'
import {
  findTodaySession,
  resolveSessionSchedule,
  scheduledAtFromSchedule,
} from '../lib/session.utils'
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

classRouter.get('/classes', requireAuthPremium, async (req, res) => {
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
        sessions: { where: { scheduledAt: { gte: start, lte: end }, status: { in: ['in_progress', 'finished'] } }, take: 1 },
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

classRouter.post('/classes', requireAuthPremium, async (req, res) => {
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

classRouter.get('/classes/:id', requireAuthPremium, async (req, res) => {
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

classRouter.post('/classes/:id/schedules', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    // Security: verify the class belongs to the user's organization
    const cls = await prisma.class.findFirst({ where: { id: String(req.params.id), orgId } })
    if (!cls) return res.status(404).json({ error: 'Group not found in your organization' })

    const { dayOfWeek, startTime, endTime, notes, teacherId, isPermanent } = req.body
    const schedule = await prisma.schedule.create({
      data: {
        classId: cls.id,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        notes: notes || null,
        teacherId: teacherId || null,
        isPermanent: isPermanent !== undefined ? Boolean(isPermanent) : true,
      },
    })
    res.status(201).json(schedule)
  } catch (err) {
    console.error('Error creating schedule:', err)
    res.status(500).json({ error: 'Failed to create schedule' })
  }
})

// ─── PATCH /schedules/:id (toggle isPermanent or update schedule) ─────────────

classRouter.patch('/schedules/:id', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const schedule = await prisma.schedule.findFirst({
      where: { id: String(req.params.id), class: { orgId } },
    })
    if (!schedule) return res.status(404).json({ error: 'Schedule not found in your organization' })

    const { isPermanent, startTime, endTime, notes, dayOfWeek, teacherId } = req.body
    const updated = await prisma.schedule.update({
      where: { id: schedule.id },
      data: {
        ...(isPermanent !== undefined && { isPermanent: Boolean(isPermanent) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(dayOfWeek !== undefined && { dayOfWeek: Number(dayOfWeek) }),
        ...(teacherId !== undefined && { teacherId: teacherId || null }),
      },
    })
    res.json(updated)
  } catch (err) {
    console.error('Error updating schedule:', err)
    res.status(500).json({ error: 'Failed to update schedule' })
  }
})

// ─── DELETE /schedules/:id (with orgId check) ───────────────────────────────

classRouter.delete('/schedules/:id', requireAuthPremium, async (req, res) => {
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

classRouter.post('/classes/:id/students', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const classId = String(req.params.id)
    const { firstName, lastName, phone, email, planId } = req.body

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' })
    }

    const cls = await prisma.class.findFirst({ where: { id: classId, orgId } })
    if (!cls) return res.status(404).json({ error: 'Group not found in your organization' })

    const normalizedEmail = email ? String(email).trim().toLowerCase() : null
    const normalizedPhone = phone ? String(phone).trim() : null

    const result = await prisma.$transaction(async (tx) => {
      let student = normalizedEmail
        ? await tx.student.findFirst({ where: { orgId, email: normalizedEmail } })
        : null
      if (!student && normalizedPhone) {
        student = await tx.student.findFirst({ where: { orgId, phone: normalizedPhone } })
      }

      if (!student) {
        student = await tx.student.create({
          data: {
            orgId,
            firstName,
            lastName,
            phone: normalizedPhone,
            email: normalizedEmail,
          },
        })
      }

      const existingEnrollment = await tx.enrollment.findUnique({
        where: { studentId_classId: { studentId: student.id, classId } },
      })
      if (existingEnrollment) {
        throw new Error('ENROLLMENT_EXISTS')
      }

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
    if (err instanceof Error && err.message === 'ENROLLMENT_EXISTS') {
      return res.status(409).json({ error: 'Student is already enrolled in this group' })
    }
    console.error('Error adding student to class:', err)
    res.status(500).json({ error: 'Failed to add student to class' })
  }
})

// ─── DELETE /enrollments/:id — remove student from group ───────────────────

classRouter.delete('/enrollments/:id', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: String(req.params.id), class: { orgId } },
    })
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found in your organization' })
    }

    await prisma.enrollment.delete({ where: { id: enrollment.id } })
    res.json({ ok: true, deletedId: enrollment.id })
  } catch (err) {
    console.error('Error removing enrollment:', err)
    res.status(500).json({ error: 'Failed to remove student from group' })
  }
})

// ─── GET /classes/:id/subscriptions ─────────────────────────────────────────

classRouter.get('/classes/:id/subscriptions', requireAuthPremium, async (req, res) => {
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

classRouter.get('/classes/:id/session', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const classId = String(req.params.id)
    const { start, end } = todayRange()

    // Only return active (in_progress) sessions — finished sessions return null
    // so the UI can offer to start a new session slot.
    const active = await prisma.session.findFirst({
      where: { classId, scheduledAt: { gte: start, lte: end }, class: { orgId }, status: 'in_progress' },
      include: { ...sessionWithClassInclude, schedule: true },
    })
    res.json(active ?? null)
  } catch (err) {
    console.error('Error fetching class session:', err)
    res.status(500).json({ error: 'Failed to fetch session' })
  }
})

// ─── POST /classes/:id/session/start ────────────────────────────────────────

classRouter.post('/classes/:id/session/start', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const classId = String(req.params.id)
    const { scheduleId } = req.body ?? {}
    const cls = await prisma.class.findFirst({ where: { id: classId, orgId } })
    if (!cls) return res.status(404).json({ error: 'Group not found in your organization' })

    const schedule = await resolveSessionSchedule(classId, scheduleId)
    const scheduledAt = schedule ? scheduledAtFromSchedule(schedule) : new Date()

    const { start, end } = todayRange()
    const activeSession = await prisma.session.findFirst({
      where: {
        classId,
        scheduledAt: { gte: start, lte: end },
        class: { orgId },
        status: 'in_progress',
        ...(schedule ? { scheduleId: schedule.id } : {}),
      },
      include: { ...sessionWithClassInclude, schedule: true },
    })

    const now = new Date()
    let session = activeSession
    if (!session) {
      session = await prisma.session.create({
        data: {
          classId,
          scheduleId: schedule?.id ?? null,
          scheduledAt,
          startedAt: now,
          status: 'in_progress',
        },
      })
    }

    const full = await prisma.session.findUnique({
      where: { id: session.id },
      include: { ...sessionWithClassInclude, schedule: true },
    })
    res.json(full)
  } catch (err) {
    console.error('Error starting session:', err)
    res.status(500).json({ error: 'Failed to start session' })
  }
})

// ─── POST /classes/:id/session/end ──────────────────────────────────────────

classRouter.post('/classes/:id/session/end', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const classId = String(req.params.id)
    const { start, end } = todayRange()

    const session = await prisma.session.findFirst({
      where: { classId, scheduledAt: { gte: start, lte: end }, class: { orgId }, status: 'in_progress' },
      include: { schedule: true },
    })
    if (!session) return res.status(404).json({ error: 'No active session to end' })

    const updated = await prisma.session.update({
      where: { id: session.id },
      data: { status: 'finished', endedAt: new Date() },
    })

    // If the session was linked to a schedule and the schedule is NOT permanent, delete it from the schedule table
    if (session.scheduleId && session.schedule && !session.schedule.isPermanent) {
      await prisma.schedule.delete({ where: { id: session.scheduleId } }).catch((err) => {
        console.error('Failed to auto-delete non-permanent schedule:', err)
      })
    }

    const full = await prisma.session.findUnique({
      where: { id: updated.id },
      include: { ...sessionWithClassInclude, schedule: true },
    })
    res.json(full)
  } catch (err) {
    console.error('Error ending session:', err)
    res.status(500).json({ error: 'Failed to end session' })
  }
})

// ─── GET /classes/:id/history ───────────────────────────────────────────────

classRouter.get('/classes/:id/history', requireAuthPremium, async (req, res) => {
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

// ─── DELETE /classes/:classId/history/:sessionId ───────────────────────────

classRouter.delete('/classes/:classId/history/:sessionId', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { classId, sessionId } = req.params

    const session = await prisma.session.findFirst({
      where: { id: sessionId, classId, class: { orgId } },
    })
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    await prisma.session.delete({ where: { id: session.id } })
    res.json({ ok: true, deletedId: session.id })
  } catch (err) {
    console.error('Error deleting class session history:', err)
    res.status(500).json({ error: 'Failed to delete session history' })
  }
})

// ─── GET /teachers ──────────────────────────────────────────────────────────

classRouter.get('/teachers', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const teachers = await prisma.user.findMany({
      where: { orgId, role: { in: ['TEACHER', 'ADMIN', 'TUTOR'] } },
      select: publicUserSelect,
      orderBy: { name: 'asc' },
    })
    res.json(teachers)
  } catch (err) {
    console.error('Error fetching teachers:', err)
    res.status(500).json({ error: 'Failed to fetch teachers' })
  }
})

// ─── GET /schedules ─────────────────────────────────────────────────────────

classRouter.get('/schedules', requireAuthPremium, async (req, res) => {
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

classRouter.delete('/classes/:id', requireAuthPremium, async (req, res) => {
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

