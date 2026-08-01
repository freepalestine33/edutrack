import type { QueryClient } from '@tanstack/react-query'

/** Invalidate all caches affected by session / attendance changes. */
export function invalidateSessionData(qc: QueryClient, groupId?: string) {
  qc.invalidateQueries({ queryKey: ['sessions-today'] })
  qc.invalidateQueries({ queryKey: ['dashboard'] })
  qc.invalidateQueries({ queryKey: ['groups'] })
  qc.invalidateQueries({ queryKey: ['subscriptions'] })
  if (groupId) {
    qc.invalidateQueries({ queryKey: ['group-session', groupId] })
    qc.invalidateQueries({ queryKey: ['group', groupId] })
    qc.invalidateQueries({ queryKey: ['group-history', groupId] })
  }
}

/** Invalidate all caches affected by student / enrollment changes. */
export function invalidateStudentData(qc: QueryClient, groupId?: string) {
  qc.invalidateQueries({ queryKey: ['students'] })
  qc.invalidateQueries({ queryKey: ['dashboard'] })
  qc.invalidateQueries({ queryKey: ['groups'] })
  if (groupId) {
    qc.invalidateQueries({ queryKey: ['group', groupId] })
    qc.invalidateQueries({ queryKey: ['group-history', groupId] })
  }
}
