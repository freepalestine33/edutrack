import { useParams, Navigate } from 'react-router-dom'

/**
 * The standalone History tab has been removed.
 * Attendance history is now surfaced per-student inside the Students tab accordion.
 * This component simply redirects any existing bookmarks/links to the Students tab.
 */
export function GroupHistoryPage() {
  const { groupId } = useParams()
  return <Navigate to={`/groups/${groupId}/students`} replace />
}
