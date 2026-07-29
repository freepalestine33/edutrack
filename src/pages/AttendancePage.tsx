import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import { api } from '@/lib/api'
import type { SessionItem, GroupEnrollment } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader, LoadingState, EmptyState } from '@/components/PageHeader'
import { cn } from '@/lib/utils'

export function AttendancePage() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { data: sessions = [], isLoading } = useQuery<SessionItem[]>({
    queryKey: ['sessions-today'],
    queryFn: api.getTodaySessions,
  })

  const markMutation = useMutation({
    mutationFn: api.markAttendance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions-today'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  const endSessionMutation = useMutation({
    mutationFn: (groupId: string) => api.endGroupSession(groupId),
    onSuccess: () => {
      // Invalidate (don't remove) — finished sessions should remain visible
      // as read-only summaries on this page.
      qc.invalidateQueries({ queryKey: ['sessions-today'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['group-session'] })
    },
    onError: (err) => {
      console.log('End session error', err)
    },
  })

  const handleEndSession = async (classId?: string) => {
    if (!classId) {
      alert('Missing class id')
      return
    }
    try {
      await endSessionMutation.mutateAsync(classId)
    } catch (err) {
      console.log('End session failed', err)
    }
  }

  const markAllPresent = (sessionId: string, enrollments: NonNullable<SessionItem['class']['enrollments']>) => {
    enrollments.forEach((enr: GroupEnrollment) => {
      const sub = enr.subscriptions?.[0]
      markMutation.mutate({
        sessionId,
        studentId: enr.student.id,
        status: 'PRESENT',
        subscriptionId: sub?.id,
      })
    })
  }

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <PageHeader title={t('attendance.title')} description={t('attendance.today')} />

      {!sessions.length && <EmptyState message={t('attendance.noSessions')} />}

      {sessions.map((session) => {
        const enrollments = session.class.enrollments ?? []
        const isFinished = session.status === 'finished'

        return (
          <Card key={session.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {session.class.name}
                  {isFinished && (
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-surface text-muted border border-border/60">
                      {t('attendance.finished', 'Finished')}
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-muted">
                  {session.class.subject?.name} · {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!isFinished && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => markAllPresent(session.id, enrollments)}
                  >
                    {t('attendance.markAllPresent')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleEndSession(session.class.id)}
                    disabled={endSessionMutation.isPending}
                    title={endSessionMutation.isPending ? t('common.loading') : t('groups.endSession')}
                  >
                    {t('groups.endSession')}
                  </Button>
                </>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {enrollments.map((enr) => {
                  const existing = session.attendances.find((a) => a.studentId === enr.student.id)
                  const sub = enr.subscriptions?.[0]
                  const noSubscription = !sub
                  const needsRenewal = sub?.status === 'EXPIRED' || sub?.status === 'WARNING'

                  return (
                    <div
                      key={enr.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center text-accent text-xs font-semibold shrink-0">
                          {enr.student.firstName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-foreground block truncate">
                            {enr.student.firstName} {enr.student.lastName}
                          </span>
                          {(noSubscription || needsRenewal) && (
                            <span className="text-[11px] text-amber-500 font-medium">
                              {noSubscription ? t('groups.noSubscription') : t('attendance.needsRenewal', 'Needs renewal')}
                            </span>
                          )}
                        </div>
                      </div>

                      {isFinished ? (
                        // Read-only badge for finished sessions
                        <AttendanceBadge status={existing?.status} presentLabel={t('attendance.present')} absentLabel={t('attendance.absent')} unmarkedLabel={t('attendance.unmarked', '—')} />
                      ) : (
                        // Interactive toggles for in-progress sessions
                        <div className="flex gap-1 shrink-0">
                          {(['PRESENT', 'ABSENT'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() =>
                                markMutation.mutate({
                                  sessionId: session.id,
                                  studentId: enr.student.id,
                                  status,
                                  subscriptionId: sub?.id,
                                })
                              }
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                                existing?.status === status
                                  ? status === 'PRESENT'
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'bg-red-500 text-white shadow-sm'
                                  : 'bg-card border border-border text-muted hover:text-foreground hover:bg-surface-hover',
                              )}
                            >
                              {t(`attendance.${status.toLowerCase()}`)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function AttendanceBadge({
  status,
  presentLabel,
  absentLabel,
  unmarkedLabel,
}: {
  status?: string
  presentLabel: string
  absentLabel: string
  unmarkedLabel: string
}) {
  if (status === 'PRESENT') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Check className="w-3 h-3" />
        {presentLabel}
      </span>
    )
  }
  if (status === 'ABSENT') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-500">
        <X className="w-3 h-3" />
        {absentLabel}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-surface text-muted border border-border/50">
      {unmarkedLabel}
    </span>
  )
}
