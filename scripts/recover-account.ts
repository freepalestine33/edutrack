import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = await new Promise<Buffer>((resolve, reject) =>
    crypto.scrypt(password, salt, 64, (error, key) => (error ? reject(error) : resolve(key))),
  )
  return `${salt}:${hash.toString('hex')}`
}

async function main() {
  const [email, password] = process.argv.slice(2)

  if (!email || !password) {
    const users = await prisma.user.findMany({ select: { name: true, email: true, role: true }, orderBy: { createdAt: 'asc' } })
    console.table(users)
    console.log('\nUsage: npm run account:recover -- your@email.com a-new-password')
    process.exitCode = 1
    return
  }

  if (password.length < 8) throw new Error('New password must be at least 8 characters.')
  const normalizedEmail = email.trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) throw new Error('No account exists for that email.')

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } })
  console.log(`Password reset for ${user.email}. You can now sign in.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
