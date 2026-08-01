import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const org = await prisma.organization.findFirst()
  console.log('org', org?.id, org?.name)
  const plans = await prisma.subscriptionPlan.findMany({ where: { orgId: org?.id }, take: 10 })
  console.log('plans', plans.map((p) => ({ id: p.id, name: p.name, sessionsCount: p.sessionsCount, price: p.price })))
  const subs = await prisma.subscription.findMany({ take: 10, include: { enrollment: { include: { student: true } }, plan: true } })
  console.log('subs', subs.map((s) => ({ id: s.id, status: s.status, enrollmentId: s.enrollmentId, planId: s.planId, remaining: s.sessionsRemaining, student: `${s.enrollment.student.firstName} ${s.enrollment.student.lastName}`, planName: s.plan.name })))
} finally {
  await prisma.$disconnect()
}
