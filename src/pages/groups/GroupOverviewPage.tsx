import { Link, useParams } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ClipboardCheck,
  AlertTriangle,
  XCircle,
  Users,
  Play,
  CheckCircle2,
  CreditCard,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { StatCard } from '@/components/StatCard'
import { getDayNames } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { GroupContext } from './GroupLayout'

export function GroupOverviewPage() {
  const { groupId } = useParams()
  const { group, session } = useOutletContext<GroupContext>()
  const { t } = useTranslation()

  const subs = group.subscriptions ?? []
  const expired = subs.filter((s) => s.status === 'EXPIRED')
  const warning = subs.filter((s) => s.status === 'WARNING')
  const active = subs.filter((s) => s.status === 'ACTIVE')
  const today = new Date().getDay()
  const todaySchedule = group.schedules?.filter((s) => s.dayOfWeek === today) ?? []
  const sessionActive = !!session && session.status === 'in_progress'

  const attendances = session?.attendances ?? []
  const enrollments = group.enrollments ?? []
  const presentCount = attendances.filter((a) => a.status === 'PRESENT').length
  const absentCount = attendances.filter((a) => a.status === 'ABSENT').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('groups.students')} value={enrollments.length} icon={Users} />
        <StatCard label={t('status.ACTIVE')} value={active.length} variant="success" icon={CheckCircle2} />
        <StatCard label={t('status.WARNING')} value={warning.length} variant="warning" icon={AlertTriangle} />
        <StatCard label={t('status.EXPIRED')} value={expired.length} variant="danger" icon={XCircle} />
      </div>

      {/* ── Session Status Card ── */}
      {sessionActive ? (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-5">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t('groups.sessionInProgress')}</p>
                <p className="text-xs text-muted mt-0.5">
                  {presentCount > 0 || absentCount > 0
                    ? `${presentCount} present · ${absentCount} absent · ${enrollments.length - presentCount - absentCount} unmarked`
                    : `${enrollments.length} students — roll call pending`}
                </p>
              </div>
            </div>
            <Link
              to={`/groups/${groupId}/session`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors shrink-0"
            >
              <ClipboardCheck className="w-4 h-4" />
              {t('groups.rollCall')}
            </Link>
          </div>
        </div>
      ) : (
        todaySchedule.length > 0 && (
          <Card className="border-dashed border-accent/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                {t('groups.todaySchedule')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {todaySchedule.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-surface">
                    <span className="text-sm font-medium">{getDayNames()[s.dayOfWeek]}</span>
                    <span className="text-sm text-muted tabular-nums">{s.startTime} – {s.endTime}</span>
                    {s.notes && <span className="text-xs text-muted">{s.notes}</span>}
                  </div>
                ))}
              </div>
              <Link
                to={`/groups/${groupId}/session`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors shadow-sm"
              >
                <Play className="w-4 h-4" />
                {t('groups.startSession')}
              </Link>
            </CardContent>
          </Card>
        )
      )}

      {/* ── Subscription Alerts (compact, link to subscriptions) ── */}
      {(expired.length > 0 || warning.length > 0) && (
        <Card className={cn(
          'border',
          expired.length > 0 ? 'border-red-500/25' : 'border-amber-500/25',
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted" />
              {t('groups.needsAttention')}
              <span className="ml-auto text-xs font-normal text-muted">
                {expired.length + warning.length} students
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...expired.slice(0, 3), ...warning.slice(0, 3 - Math.min(expired.length, 3))].map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-surface">
                <div>
                  <p className="text-sm font-medium">
                    {sub.enrollment.student.firstName} {sub.enrollment.student.lastName}
                  </p>
                  <p className="text-xs text-muted">
                    {t('dashboard.sessionsLeft', { count: sub.sessionsRemaining })}
                  </p>
                </div>
                <StatusBadge status={sub.status} />
              </div>
            ))}
            <Link
              to={`/groups/${groupId}/subscriptions`}
              className="text-sm text-accent hover:underline mt-1 inline-block"
            >
              {t('groups.viewAllSubscriptions')} →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
