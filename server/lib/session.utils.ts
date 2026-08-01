import { prisma } from './prisma'
import { todayRange } from './utils'

/** Combine today's date with a "HH:mm" schedule time string. */
export function combineDateAndTime(baseDate: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const result = new Date(baseDate)
  result.setHours(hours || 0, minutes || 0, 0, 0)
  return result
}

/** All recurring schedule slots for a class on today's weekday. */
export async function getTodaySchedulesForClass(classId: string) {
  const dayOfWeek = new Date().getDay()
  return prisma.schedule.findMany({
    where: { classId, dayOfWeek },
    orderBy: { startTime: 'asc' },
  })
}

/** Pick the schedule slot to use when starting a session. */
export async function resolveSessionSchedule(classId: string, scheduleId?: string) {
  const schedules = await getTodaySchedulesForClass(classId)
  if (!schedules.length) return null

  if (scheduleId) {
    return schedules.find((s) => s.id === scheduleId) ?? null
  }

  const now = new Date()
  const current = schedules.find((s) => {
    const start = combineDateAndTime(now, s.startTime)
    const end = combineDateAndTime(now, s.endTime)
    return now >= start && now <= end
  })
  if (current) return current

  const upcoming = schedules.find((s) => combineDateAndTime(now, s.startTime) > now)
  return upcoming ?? schedules[0]
}

/** Build scheduledAt from a schedule slot (uses startTime on today's date). */
export function scheduledAtFromSchedule(schedule: { startTime: string }): Date {
  return combineDateAndTime(new Date(), schedule.startTime)
}

/** Find today's session for a class, optionally scoped to a schedule slot. */
export async function findTodaySession(classId: string, scheduleId?: string | null) {
  const { start, end } = todayRange()
  return prisma.session.findFirst({
    where: {
      classId,
      scheduledAt: { gte: start, lte: end },
      ...(scheduleId ? { scheduleId } : {}),
    },
    orderBy: { scheduledAt: 'asc' },
  })
}
