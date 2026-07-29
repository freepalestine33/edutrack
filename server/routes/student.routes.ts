import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

export const studentRouter = Router()

studentRouter.get('/students', requireAuth, async (req, res) => {
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

studentRouter.post('/students', requireAuth, async (req, res) => {
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
