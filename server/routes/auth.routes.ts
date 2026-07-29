import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { passwordMatches, publicUser, requireAuth, signToken } from '../middleware/auth'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const normalizedEmail = String(email).trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    if (!user || !(await passwordMatches(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const safeUser = publicUser(user)
    res.json({ user: safeUser, token: signToken(safeUser) })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.auth })
})
