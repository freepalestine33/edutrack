import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../server/middleware/auth'

const prisma = new PrismaClient()

async function main() {
  const email = 'yacinegorine15@gmail.com'
  const password = 'admin123456' // Default password, user should change it

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    // Update existing user to admin role
    user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    })
    console.log('Updated existing user to ADMIN role:', email)
  } else {
    // Create new admin user
    // First create an organization for the admin
    const org = await prisma.organization.create({
      data: {
        name: 'Admin Organization',
        type: 'ACADEMY',
        locale: 'en',
        currency: 'DZD',
      },
    })

    user = await prisma.user.create({
      data: {
        orgId: org.id,
        email,
        name: 'Yacine Gorine',
        role: 'ADMIN',
        passwordHash: await hashPassword(password),
      },
    })
    console.log('Created new admin user:', email)
    console.log('Default password:', password)
  }

  console.log('Admin user details:', {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    orgId: user.orgId,
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
