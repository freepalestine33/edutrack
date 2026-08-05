import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { ADMIN_EMAILS, passwordMatches, publicUser, requireAuth, signToken } from '../middleware/auth'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const normalizedEmail = String(email).trim().toLowerCase()
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    if (!user || !(await passwordMatches(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (ADMIN_EMAILS.includes(normalizedEmail) && user.role !== 'ADMIN') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      })
    }

    const safeUser = publicUser(user)
    res.json({ user: safeUser, token: signToken(safeUser) })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

authRouter.get('/me', requireAuth, async (req, res) => {
  if (req.auth?.email && ADMIN_EMAILS.includes(req.auth.email.toLowerCase()) && req.auth.role !== 'ADMIN') {
    try {
      await prisma.user.update({
        where: { id: req.auth.id },
        data: { role: 'ADMIN' },
      })
      req.auth.role = 'ADMIN'
    } catch (err) {
      console.error('Error updating admin role in /me:', err)
    }
  }
  res.json({ user: req.auth })
})
