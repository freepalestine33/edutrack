import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Users, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { StatCard, MoneyStat } from '@/components/StatCard'
import { StatusBadge } from '@/components/StatusBadge'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader, LoadingState } from '@/components/PageHeader'

export function DashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: api.getDashboard })

  if (isLoading) return <LoadingState />

  const stats = data?.stats
  const today = new Date().getDay()

  return (
    <div className="space-y-8">
      <PageHeader title={t('dashboard.title')} description={t('app.tagline')} />

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={t('dashboard.students')} value={stats.students} icon={Users} />
          <StatCard label={t('dashboard.active')} value={stats.active} variant="success" icon={CheckCircle2} />
          <StatCard label={t('dashboard.warning')} value={stats.warning} variant="warning" icon={AlertTriangle} />
          <StatCard label={t('dashboard.expired')} value={stats.expired} variant="danger" icon={XCircle} />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MoneyStat label={t('dashboard.revenue')} amount={stats.revenue} />
          <MoneyStat label={t('dashboard.expenses')} amount={stats.expenses} />
          <StatCard label={t('dashboard.profit')} value={`${stats.profit.toLocaleString()} DZD`} variant={stats.profit >= 0 ? 'success' : 'danger'} />
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('groups.todayGroups')}</h2>
          <Link to="/groups" className="text-sm text-accent hover:underline">
            {t('groups.viewAll')}
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {data?.groups
            .filter((g) => g.schedules?.some((s) => s.dayOfWeek === today))
            .map((group) => (
              <Link key={group.id} to={`/groups/${group.id}/session`}>
                <GlassPanel variant="card" className="hover:card-shadow-lg transition-shadow cursor-pointer">
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{group.name}</p>
                      <p className="text-xs text-muted flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {group.schedules
                          ?.filter((s) => s.dayOfWeek === today)
                          .map((s) => `${s.startTime}–${s.endTime}`)
                          .join(', ')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted" />
                  </div>
                </GlassPanel>
              </Link>
            ))}
          {!data?.groups.some((g) => g.schedules?.some((s) => s.dayOfWeek === today)) && (
            <p className="text-sm text-muted col-span-2 py-4">{t('groups.noGroupsToday')}</p>
          )}
        </div>
      </section>

      {data?.subscriptions && data.subscriptions.length > 0 && (
        <GlassPanel variant="card" className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('groups.needsAttention')}</h3>
          <div className="space-y-2">
            {data.subscriptions.map((sub) => (
              <Link
                key={sub.id}
                to={`/groups/${sub.enrollment.class?.id ?? ''}/subscriptions`}
                className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-hover transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {sub.enrollment.student.firstName} {sub.enrollment.student.lastName}
                  </p>
                  <p className="text-xs text-muted">
                    {sub.enrollment.class?.name} · {t('dashboard.sessionsLeft', { count: sub.sessionsRemaining })}
                  </p>
                </div>
                <StatusBadge status={sub.status} />
              </Link>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  )
}
