import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Play,
  Square,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { LoadingState } from '@/components/PageHeader'
import { cn } from '@/lib/utils'

export function GroupSessionPage() {
  const { groupId } = useParams()
  const { t } = useTranslation()
  const qc = useQueryClient()

  const {
    data: session,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['group-session', groupId],
    queryFn: () => api.getGroupSession(groupId!),
    enabled: !!groupId,
    retry: 1,
  })

  const startSession = useMutation({
    mutationFn: () => api.startGroupSession(groupId!),
    onSuccess: () => {
      refetch()
      qc.invalidateQueries({ queryKey: ['group-session', groupId] })
      qc.invalidateQueries({ queryKey: ['sessions-today'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const markMutation = useMutation({
    mutationFn: api.markAttendance,
    onSuccess: () => {
      refetch()
      qc.invalidateQueries({ queryKey: ['sessions-today'] })
      qc.invalidateQueries({ queryKey: ['group', groupId] })
      qc.invalidateQueries({ queryKey: ['group-history', groupId] })
    },
  })

  const endSession = useMutation({
    mutationFn: () => api.endGroupSession(groupId!),
    onSuccess: () => {
      refetch()
      // Invalidate queries to refresh the UI and stop the session 'active' indicators
      qc.invalidateQueries({ queryKey: ['group-session', groupId] })
      qc.invalidateQueries({ queryKey: ['sessions-today'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['group', groupId] })
      qc.invalidateQueries({ queryKey: ['groups'] })
    },
  })

  if (isLoading) return <LoadingState />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertTriangle className="w-9 h-9 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Error loading session</h2>
        <p className="text-sm text-muted mt-2 text-center max-w-sm">
          {error instanceof Error ? error.message : 'Failed to load session data'}
        </p>
        <Button className="mt-6" onClick={() => refetch()} variant="secondary">
          Retry
        </Button>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────
  // NO ACTIVE SESSION
  // ──────────────────────────────────────────────────────────────
  if (!session || session.status === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-surface border border-border/60 flex items-center justify-center mb-6 shadow-sm">
          <ClipboardCheck className="w-9 h-9 text-muted" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{t('groups.noActiveSession')}</h2>
        <p className="text-sm text-muted mt-2 text-center max-w-sm">
          {t('groups.startSessionDesc')}
        </p>
        <Button
          className="mt-8"
          size="lg"
          onClick={() => startSession.mutate()}
          disabled={startSession.isPending}
        >
          {startSession.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('groups.starting')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              {t('groups.startSession')}
            </>
          )}
        </Button>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────
  // ACTIVE SESSION
  // ──────────────────────────────────────────────────────────────
  const enrollments = session.class.enrollments ?? []
  const attendances = session.attendances ?? []

  const presentCount = attendances.filter((a) => a.status === 'PRESENT').length
  const absentCount = attendances.filter((a) => a.status === 'ABSENT').length
  const unmarkedCount = enrollments.length - presentCount - absentCount
  const totalEnrolled = enrollments.length

  const markAllPresent = () => {
    enrollments.forEach((enr) => {
      const sub = enr.subscriptions?.[0]
      const already = attendances.find((a) => a.studentId === enr.student.id)
      if (already?.status === 'PRESENT') return
      markMutation.mutate({
        sessionId: session.id,
        studentId: enr.student.id,
        status: 'PRESENT',
        subscriptionId: sub?.id,
      })
    })
  }

  const sessionDate = new Date(session.scheduledAt)
  const isFinished = session.status === 'finished'

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Session Banner ── */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-5 border',
        isFinished ? 'border-border/50 bg-surface/60' : 'border-emerald-500/30 bg-emerald-500/8',
      )}>
        {!isFinished && (
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
        )}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isFinished ? (
              <div className="h-3 w-3 rounded-full bg-muted" />
            ) : (
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground flex items-center gap-2">
                {isFinished ? t('attendance.finished', 'Session finished') : t('groups.sessionInProgress')}
                <span className="text-xs font-normal text-muted hidden sm:inline">
                  <Clock className="w-3 h-3 inline mr-0.5" />
                  {sessionDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </p>
              <p className="text-xs text-muted mt-0.5 sm:hidden">
                {sessionDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {!isFinished && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={markAllPresent}
                disabled={markMutation.isPending || !enrollments.length}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {t('attendance.markAllPresent')}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => endSession.mutate()}
                disabled={endSession.isPending}
              >
                {endSession.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t('groups.ending')}
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    {t('groups.endSession')}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Attendance Stats Bar ── */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{presentCount}</p>
          <p className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wide mt-0.5">
            {t('attendance.present')}
          </p>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
          <p className="text-2xl font-black text-red-500">{absentCount}</p>
          <p className="text-xs font-semibold text-red-500/80 uppercase tracking-wide mt-0.5">
            {t('attendance.absent')}
          </p>
        </div>
        <div className="rounded-xl bg-surface border border-border/60 p-3 text-center">
          <p className="text-2xl font-black text-muted">{unmarkedCount}</p>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mt-0.5">
            {t('groups.unmarked')}
          </p>
        </div>
      </div>

      {/* ── Roll Call ── */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-accent" />
            {t('groups.rollCall')}
            <span className="ml-auto text-xs font-normal text-muted">
              {totalEnrolled} {t('groups.students')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {enrollments.length === 0 ? (
            <p className="text-center text-muted py-12 text-sm">{t('groups.noStudents')}</p>
          ) : (
            <div className="divide-y divide-border/30">
              {enrollments.map((enr) => {
                const existing = attendances.find((a) => a.studentId === enr.student.id)
                const sub = enr.subscriptions?.[0]
                const needsRenewal = sub?.status === 'EXPIRED' || sub?.status === 'WARNING'
                const isMarking = markMutation.isPending

                return (
                  <div
                    key={enr.id}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5 transition-colors',
                      existing?.status === 'PRESENT' && 'bg-emerald-500/5',
                      existing?.status === 'ABSENT' && 'bg-red-500/5',
                    )}
                  >
                    {/* Student info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors border-2',
                          existing?.status === 'PRESENT'
                            ? sub?.status === 'ACTIVE' 
                              ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500'
                              : 'bg-emerald-500/20 text-emerald-600 border-red-500'
                            : existing?.status === 'ABSENT'
                              ? 'bg-red-500/20 text-red-500 border-red-500'
                              : 'bg-surface text-muted border-transparent',
                        )}
                      >
                        {enr.student.firstName.charAt(0)}
                        {enr.student.lastName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {enr.student.firstName} {enr.student.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {sub ? (
                            <>
                              <StatusBadge status={sub.status} />
                              <span
                                className={cn(
                                  'text-xs tabular-nums',
                                  needsRenewal ? 'text-amber-500 font-medium' : 'text-muted',
                                )}
                              >
                                {sub.sessionsRemaining}/{sub.sessionsTotal} sessions
                              </span>
                              {needsRenewal && (
                                <span className="text-xs text-amber-500 flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3" />
                                  Needs renewal
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-amber-500 flex items-center gap-0.5 font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              {t('groups.noSubscription')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Present / Absent toggles — or read-only badge when finished */}
                    {isFinished ? (
                      <AttendanceReadOnlyBadge status={existing?.status} />
                    ) : (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() =>
                            markMutation.mutate({
                              sessionId: session.id,
                              studentId: enr.student.id,
                              status: 'PRESENT',
                              subscriptionId: sub?.id,
                            })
                          }
                          disabled={isMarking}
                          aria-label={`Mark ${enr.student.firstName} present`}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                            existing?.status === 'PRESENT'
                              ? sub?.status === 'ACTIVE'
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20 scale-[1.03]'
                                : 'bg-emerald-500 text-white border-red-500 shadow-sm shadow-red-500/20 scale-[1.03]'
                              : 'bg-card border-border text-muted hover:border-emerald-400 hover:text-emerald-600',
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('attendance.present')}
                        </button>
                        <button
                          onClick={() =>
                            markMutation.mutate({
                              sessionId: session.id,
                              studentId: enr.student.id,
                              status: 'ABSENT',
                              subscriptionId: sub?.id,
                            })
                          }
                          disabled={isMarking}
                          aria-label={`Mark ${enr.student.firstName} absent`}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                            existing?.status === 'ABSENT'
                              ? 'bg-red-500 text-white border-red-600 shadow-sm shadow-red-500/20 scale-[1.03]'
                              : 'bg-card border-border text-muted hover:border-red-400 hover:text-red-500',
                          )}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {t('attendance.absent')}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/** Read-only attendance indicator shown for finished sessions (no toggles). */
function AttendanceReadOnlyBadge({ status }: { status?: string }) {
  const { t } = useTranslation()
  if (status === 'PRESENT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {t('attendance.present')}
      </span>
    )
  }
  if (status === 'ABSENT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-500 border border-red-500/30">
        <XCircle className="w-3.5 h-3.5" />
        {t('attendance.absent')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-surface text-muted border border-border/50">
      {t('attendance.unmarked', '—')}
    </span>
  )
}

