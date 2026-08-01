import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuthPremium } from '../middleware/auth'
import { sendWhatsAppBusinessMessage } from '../services/whatsapp.service'
import { todayRange } from '../lib/utils'

export const reminderRouter = Router()

reminderRouter.post('/reminders/expiry', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const subs = await prisma.subscription.findMany({
      where: {
        status: { in: ['WARNING', 'EXPIRED'] },
        enrollment: { class: { orgId } },
      },
      include: { enrollment: { include: { student: true, class: true } }, plan: true },
    })

    const results: any[] = []
    for (const s of subs) {
      const student = s.enrollment?.student
      const cls = s.enrollment?.class
      if (!student || !student.phone) continue
      const text = `Reminder: your subscription${cls ? ` for ${cls.name}` : ''} is ${s.status.toLowerCase()}. Remaining sessions: ${s.sessionsRemaining}. Please renew at ${process.env.APP_URL ?? 'http://localhost:4173'}`
      try {
        await sendWhatsAppBusinessMessage(student.phone, text)
        results.push({ studentId: student.id, phone: student.phone, status: 'sent' })
      } catch (err) {
        results.push({ studentId: student.id, phone: student.phone, status: 'error', error: String(err) })
      }
    }
    res.json({ sent: results.length, results })
  } catch (err) {
    console.error('Error sending expiry reminders:', err)
    res.status(500).json({ error: 'Failed to send expiry reminders' })
  }
})

reminderRouter.post('/reminders/absence', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { start, end } = todayRange()
    const absences = await prisma.attendance.findMany({
      where: {
        status: 'ABSENT',
        session: { scheduledAt: { gte: start, lte: end }, class: { orgId } },
      },
      include: { student: true, session: { include: { class: true } } },
    })

    const results: any[] = []
    for (const a of absences) {
      const student = a.student
      const cls = a.session?.class
      if (!student || !student.phone) continue
      const text = `We noticed you were absent from ${cls ? cls.name : 'class'} today. If this is a mistake please contact us or reschedule.`
      try {
        await sendWhatsAppBusinessMessage(student.phone, text)
        results.push({ studentId: student.id, phone: student.phone, status: 'sent' })
      } catch (err) {
        results.push({ studentId: student.id, phone: student.phone, status: 'error', error: String(err) })
      }
    }
    res.json({ sent: results.length, results })
  } catch (err) {
    console.error('Error sending absence reminders:', err)
    res.status(500).json({ error: 'Failed to send absence reminders' })
  }
})

reminderRouter.post('/reminders/payments', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const subs = await prisma.subscription.findMany({
      where: {
        OR: [{ status: 'EXPIRED' }, { sessionsRemaining: { lte: 0 } }],
        enrollment: { class: { orgId } },
      },
      include: { enrollment: { include: { student: true, class: true } }, plan: true },
    })

    const results: any[] = []
    for (const s of subs) {
      const student = s.enrollment?.student
      const cls = s.enrollment?.class
      if (!student || !student.phone) continue
      const text = `Payment reminder: your subscription${cls ? ` for ${cls.name}` : ''} needs renewal. Remaining sessions: ${s.sessionsRemaining}. Renew: ${process.env.APP_URL ?? 'http://localhost:4173'}`
      try {
        await sendWhatsAppBusinessMessage(student.phone, text)
        results.push({ studentId: student.id, phone: student.phone, status: 'sent' })
      } catch (err) {
        results.push({ studentId: student.id, phone: student.phone, status: 'error', error: String(err) })
      }
    }
    res.json({ sent: results.length, results })
  } catch (err) {
    console.error('Error sending payment reminders:', err)
    res.status(500).json({ error: 'Failed to send payment reminders' })
  }
})
