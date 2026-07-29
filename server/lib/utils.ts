/**
 * Shared server utilities.
 * Extracted so every route file can import them without circular deps.
 */

/** Returns a { start, end } Date pair spanning today (local server time). */
export function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

/**
 * Given a list of items sorted newest‑first, keep only the first (latest)
 * item per `enrollmentId`. Useful for deduplicating subscription lists.
 */
export function latestByEnrollment<T extends { enrollmentId: string }>(items: T[]): T[] {
  const latest = new Map<string, T>()
  for (const item of items) {
    if (!latest.has(item.enrollmentId)) {
      latest.set(item.enrollmentId, item)
    }
  }
  return Array.from(latest.values())
}
