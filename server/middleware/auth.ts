import express from 'express'
import crypto from 'crypto'

export const AUTH_SECRET = process.env.AUTH_SECRET || 'development-only-change-me'

if (process.env.NODE_ENV === 'production' && AUTH_SECRET === 'development-only-change-me') {
  console.warn('[SECURITY WARNING] AUTH_SECRET is set to default development key in production environment! Please set AUTH_SECRET in your .env file.')
}


export type AuthUser = {
  id: string
  orgId: string
  role: 'ADMIN' | 'TEACHER' | 'TUTOR'
  email: string
  name: string
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser
    }
  }
}

export function publicUser(user: any): AuthUser {
  return {
    id: user.id,
    orgId: user.orgId,
    role: user.role,
    email: user.email,
    name: user.name,
  }
}

export function signToken(user: AuthUser): string {
  const payload = Buffer.from(
    JSON.stringify({ ...user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
  ).toString('base64url')
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('base64url')
  return `${payload}.${signature}`
}

export function verifyToken(token?: string): AuthUser | null {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('base64url')
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return null
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!decoded.exp || decoded.exp < Date.now()) return null
    return {
      id: decoded.id,
      orgId: decoded.orgId,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = await new Promise<Buffer>((resolve, reject) =>
    crypto.scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key))),
  )
  return `${salt}:${hash.toString('hex')}`
}

export async function passwordMatches(
  password: string,
  stored?: string | null,
): Promise<boolean> {
  if (!stored) return false
  const [salt, storedHash] = stored.split(':')
  if (!salt || !storedHash) return false
  const hash = await new Promise<Buffer>((resolve, reject) =>
    crypto.scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key))),
  )
  const saved = Buffer.from(storedHash, 'hex')
  return saved.length === hash.length && crypto.timingSafeEqual(saved, hash)
}

export function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const user = verifyToken(
    req.header('Authorization')?.replace(/^Bearer\s+/i, ''),
  )
  if (!user) return res.status(401).json({ error: 'Sign in required' })
  req.auth = user
  next()
}

export function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  requireAuth(req, res, () => {
    if (req.auth?.role !== 'ADMIN')
      return res.status(403).json({ error: 'Administrator access required' })
    next()
  })
}
