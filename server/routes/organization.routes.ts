import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { hashPassword, publicUser, requireAuth, signToken } from '../middleware/auth'
import { withPremium } from '../lib/subscription.utils'

export const organizationRouter = Router()

organizationRouter.get('/organization', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { users: true, subjects: true },
    })
    if (!org) {
      // Return 401 so the client clears its stale token and redirects to login
      return res.status(401).json({ error: 'Organization not found — please sign in again' })
    }
    res.json(withPremium(org))
  } catch (err) {
    console.error('Error in /api/organization:', err)
    res.status(500).json({ error: 'Failed to retrieve organization' })
  }
})

organizationRouter.post('/organization', async (req, res) => {
  try {
    const { name, userName, email, password, phone } = req.body
    if (!name || !userName || !email || !password || String(password).length < 8) {
      return res.status(400).json({ error: 'Name, email, and a password of at least 8 characters are required' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) return res.status(409).json({ error: 'An account already exists for this email. Please sign in.' })

    const org = await prisma.organization.create({
      data: {
        name,
        type: 'TUTOR',
        premiumTrialUsed: false,
        users: {
          create: {
            email: normalizedEmail,
            name: userName,
            role: 'TUTOR',
            passwordHash: await hashPassword(password),
            phone: phone || null,
          },
        },
        subjects: {
          create: { name: 'General', code: 'GEN' },
        },
      },
      include: { users: true, subjects: true },
    })

    const user = publicUser(org.users[0])
    res.status(201).json({ org: { ...org, users: org.users.map(publicUser) }, user, token: signToken(user) })
  } catch (err) {
    console.error('Error creating organization:', err)
    res.status(500).json({ error: 'Failed to create organization' })
  }
})

organizationRouter.post('/account/start-trial', requireAuth, async (req, res) => {
  const { duration = 15, durationUnit = 'days' } = req.body
  const orgId = req.auth!.orgId

  try {
    const org = await prisma.organization.findUnique({ where: { id: orgId } })
    if (!org) return res.status(404).json({ error: 'Organization not found' })

    if (org.premiumTrialUsed) return res.status(400).json({ error: 'Trial already used' })
    const existingExpires = org.premiumExpiresAt ? new Date(org.premiumExpiresAt).getTime() : 0
    if (existingExpires > Date.now()) return res.status(400).json({ error: 'An active premium period is already running' })

    const now = Date.now()
    const durationMs = durationUnit === 'days' ? duration * 24 * 60 * 60 * 1000 : duration * 30 * 24 * 60 * 60 * 1000
    const expires = new Date(now + durationMs)

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: { premiumExpiresAt: expires, premiumTrialUsed: true },
    })

    await prisma.auditLog.create({
      data: {
        orgId: orgId,
        userId: req.auth!.id,
        action: 'start_trial',
        entityType: 'Organization',
        entityId: orgId,
        payload: JSON.stringify({ expires, duration, durationUnit }),
      },
    })

    res.json(withPremium(updated))
  } catch (err) {
    console.error('Start trial failed:', err)
    res.status(500).json({ error: 'Failed to start trial' })
  }
})
