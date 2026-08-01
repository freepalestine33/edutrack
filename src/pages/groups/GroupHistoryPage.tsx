import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { api, type SessionItem } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingState, EmptyState } from '@/components/PageHeader'
import { cn } from '@/lib/utils'

function formatSessionTimes(session: SessionItem) {
  if (session.schedule) {
    return `${session.schedule.startTime} – ${session.schedule.endTime}`
  }
  if (session.startedAt) {
    const start = new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const end = session.endedAt
      ? new Date(session.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '…'
    return `${start} – ${end}`
  }
  return new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function GroupHistoryPage() {
  const { groupId } = useParams()
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['group-history', groupId],
    queryFn: () => api.getGroupHistory(groupId!),
    enabled: !!groupId,
  })

  const deleteHistorySession = useMutation({
    mutationFn: (sessionId: string) => api.deleteGroupHistorySession(groupId!, sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['group-history', groupId] }),
  })

  if (isLoading) return <LoadingState />

  if (!groupId) {
    return <EmptyState message={t('groups.noHistory')} />
  }

  if (!sessions.length) {
    return <EmptyState message={t('groups.noHistory')} />
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t('groups.historyTitle')}</h2>
          <p className="text-sm text-muted mt-1">{t('groups.attendanceHistory')}</p>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const status = session.status === 'finished' ? t('attendance.finished', 'Finished') : t('groups.sessionInProgress')
          const dateLabel = new Date(session.scheduledAt).toLocaleDateString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })
          const timeLabel = session.schedule
            ? `${session.schedule.startTime} – ${session.schedule.endTime}`
            : new Date(session.startedAt ?? session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

          return (
            <Card key={session.id} className={cn('border', session.status === 'finished' ? 'opacity-90' : 'bg-surface')}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">{dateLabel}</CardTitle>
                  <p className="text-sm text-muted mt-1">
                    {timeLabel} · {status}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteHistorySession.mutate(session.id)}
                  disabled={deleteHistorySession.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                  {t('groups.deleteSession')}
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl bg-surface p-3 border border-border/60">
                    <p className="text-xs text-muted uppercase tracking-wide">{t('groups.subscriptions')}</p>
                    <p className="text-sm text-foreground">{session.class.name}</p>
                  </div>
                  <div className="rounded-xl bg-surface p-3 border border-border/60">
                    <p className="text-xs text-muted uppercase tracking-wide">{t('attendance.title')}</p>
                    <p className="text-sm text-foreground">{session.attendances.length} {t('groups.sessions')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
