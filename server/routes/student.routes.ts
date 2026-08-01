import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuthPremium } from '../middleware/auth'

export const studentRouter = Router()

studentRouter.get('/students', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const students = await prisma.student.findMany({
      where: { orgId },
      orderBy: { lastName: 'asc' },
      include: {
        enrollments: {
          include: {
            class: true,
            subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    })
    res.json(students)
  } catch (err) {
    console.error('Error getting students:', err)
    res.status(500).json({ error: 'Failed to retrieve students' })
  }
})

studentRouter.post('/students', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { firstName, lastName, phone, email } = req.body

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' })
    }

    const student = await prisma.student.create({
      data: { orgId, firstName, lastName, phone: phone || null, email: email || null },
    })
    res.status(201).json(student)
  } catch (err) {
    console.error('Error creating student:', err)
    res.status(500).json({ error: 'Failed to create student' })
  }
})

studentRouter.delete('/students/:id', requireAuthPremium, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const student = await prisma.student.findFirst({
      where: { id: String(req.params.id), orgId },
    })
    if (!student) {
      return res.status(404).json({ error: 'Student not found in your organization' })
    }

    await prisma.student.delete({ where: { id: student.id } })
    res.json({ ok: true, deletedId: student.id })
  } catch (err) {
    console.error('Error deleting student:', err)
    res.status(500).json({ error: 'Failed to delete student' })
  }
})
