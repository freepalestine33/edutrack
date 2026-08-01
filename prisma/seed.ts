import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function computeStatus(remaining: number) {
  if (remaining <= 0) return 'EXPIRED' as const
  if (remaining <= 2) return 'WARNING' as const
  return 'ACTIVE' as const
}

async function main() {
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.session.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.subscriptionPlan.deleteMany()
  await prisma.class.deleteMany()
  await prisma.student.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  const org = await prisma.organization.create({
    data: {
      name: 'Prof. Benali — Math',
      type: 'TUTOR',
      locale: 'fr',
      currency: 'DZD',
      attendancePolicyDefault: 'PAID_ABSENCE',
    },
  })

  const tutor = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'tutor@edutrack.demo',
      name: 'Sarah Benali',
      phone: '+213 555 000 001',
      role: 'TUTOR',
      // Demo sign-in password: demo12345
      passwordHash: 'edutrack-demo-salt:97712dcaeab59957e4591e114a4e65b1a01c9f68ceb465c0e3987652bb4501082283eb86b1ecd2ffc6501a1497502fe57bfe12664a4e7978b75549f954896b22',
    },
  })

  const math = await prisma.subject.create({
    data: { orgId: org.id, name: 'Mathematics', code: 'MATH' },
  })

  const groups = await Promise.all(
    ['1AS', '2AS', '3AS A', '3AS B'].map((name) =>
      prisma.class.create({
        data: {
          orgId: org.id,
          subjectId: math.id,
          teacherId: tutor.id,
          name,
          maxCapacity: 20,
        },
      }),
    ),
  )

  const [g1AS, g2AS, g3ASA, g3ASB] = groups

  await prisma.schedule.createMany({
    data: [
      { classId: g1AS.id, dayOfWeek: 0, startTime: '14:00', endTime: '16:00', notes: 'Room 3' },
      { classId: g1AS.id, dayOfWeek: 3, startTime: '14:00', endTime: '16:00', notes: null },
      { classId: g2AS.id, dayOfWeek: 1, startTime: '16:00', endTime: '18:00', notes: 'Exam prep' },
      { classId: g2AS.id, dayOfWeek: 4, startTime: '16:00', endTime: '18:00', notes: null },
      { classId: g3ASA.id, dayOfWeek: 5, startTime: '10:00', endTime: '12:00', notes: 'Group A — Bac prep' },
      { classId: g3ASA.id, dayOfWeek: 6, startTime: '10:00', endTime: '12:00', notes: null },
      { classId: g3ASB.id, dayOfWeek: 5, startTime: '14:00', endTime: '16:00', notes: 'Group B' },
      { classId: g3ASB.id, dayOfWeek: 6, startTime: '14:00', endTime: '16:00', notes: null },
    ],
  })

  const plan8 = await prisma.subscriptionPlan.create({
    data: {
      orgId: org.id,
      name: '8 Sessions Pack',
      sessionsCount: 8,
      price: 1500,
      currency: 'DZD',
      attendancePolicy: 'PAID_ABSENCE',
    },
  })

  const studentsData = [
    { firstName: 'Yasmine', lastName: 'Khelifi', group: g1AS, used: 3 },
    { firstName: 'Karim', lastName: 'Boudiaf', group: g1AS, used: 7 },
    { firstName: 'Leila', lastName: 'Amrani', group: g2AS, used: 2 },
    { firstName: 'Omar', lastName: 'Hadid', group: g2AS, used: 8 },
    { firstName: 'Nadia', lastName: 'Meziane', group: g3ASA, used: 1 },
    { firstName: 'Riad', lastName: 'Cherif', group: g3ASA, used: 6 },
    { firstName: 'Sara', lastName: 'Belkacem', group: g3ASB, used: 4 },
    { firstName: 'Amine', lastName: 'Touati', group: g3ASB, used: 0 },
  ]

  const createdStudents: Array<{ studentId: string; subscriptionId: string }> = []

  for (const s of studentsData) {
    const student = await prisma.student.create({
      data: {
        orgId: org.id,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: `+213 555 ${Math.floor(100000 + Math.random() * 899999)}`,
        email: `${s.firstName.toLowerCase()}@email.com`,
      },
    })

    const enrollment = await prisma.enrollment.create({
      data: { studentId: student.id, classId: s.group.id },
    })

    const remaining = plan8.sessionsCount - s.used
    const subscription = await prisma.subscription.create({
      data: {
        enrollmentId: enrollment.id,
        planId: plan8.id,
        sessionsTotal: plan8.sessionsCount,
        sessionsUsed: s.used,
        sessionsRemaining: remaining,
        status: computeStatus(remaining),
      },
    })

    createdStudents.push({ studentId: student.id, subscriptionId: subscription.id })
  }

  await prisma.payment.createMany({
    data: createdStudents.map(({ studentId, subscriptionId }, index) => ({
      orgId: org.id,
      studentId,
      subscriptionId,
      amount: 1500,
      currency: 'DZD',
      method: 'CASH',
      type: 'SUBSCRIPTION',
      paidAt: new Date(),
      receiptUrl: null,
    })),
  })

  await prisma.expense.createMany({
    data: [
      { orgId: org.id, category: 'Rent', amount: 15000, description: 'Classroom rent', recurring: true },
      { orgId: org.id, category: 'Materials', amount: 800, description: 'Books and copies', recurring: false },
    ],
  })

  console.log('Seed complete! Tutor with groups: 1AS, 2AS, 3AS A, 3AS B')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
