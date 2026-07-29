import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const email = process.argv[2]?.trim().toLowerCase()

async function main() {
  if (!email) throw new Error('Usage: npm run account:grant-admin -- your@email.com')
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('No account exists for that email.')
  await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
  console.log(`${email} is now an ADMIN.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
