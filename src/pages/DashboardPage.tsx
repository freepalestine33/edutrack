import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Users, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { api } from '@/lib/api'
import { StatusBadge } from '@/components/StatusBadge'
import { PageHeader, LoadingState } from '@/components/PageHeader'
import { GlassPanel } from '@/components/ui/GlassPanel'

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
          <GlassPanel className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm text-muted">{t('dashboard.students')}</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.students}</p>
          </GlassPanel>
          
          <GlassPanel className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm text-muted">{t('dashboard.active')}</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.active}</p>
          </GlassPanel>
          
          <GlassPanel className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-sm text-muted">{t('dashboard.warning')}</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.warning}</p>
          </GlassPanel>
          
          <GlassPanel className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
                <XCircle className="w-5 h-5" />
              </div>
              <p className="text-sm text-muted">{t('dashboard.expired')}</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.expired}</p>
          </GlassPanel>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassPanel variant="accent" className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-sm text-muted">{t('dashboard.revenue')}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.revenue.toLocaleString()} DZD</p>
          </GlassPanel>
          
          <GlassPanel variant="accent" className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center text-white">
                <TrendingDown className="w-5 h-5" />
              </div>
              <p className="text-sm text-muted">{t('dashboard.expenses')}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.expenses.toLocaleString()} DZD</p>
          </GlassPanel>
          
          <GlassPanel variant={stats.profit >= 0 ? 'accent' : 'danger'} className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stats.profit >= 0 ? 'from-green-400 to-green-500' : 'from-red-400 to-red-500'} flex items-center justify-center text-white`}>
                {stats.profit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <p className="text-sm text-muted">{t('dashboard.profit')}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.profit.toLocaleString()} DZD</p>
          </GlassPanel>
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
                <GlassPanel className="p-4 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
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
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('groups.needsAttention')}</h3>
          <div className="space-y-2">
            {data.subscriptions.map((sub) => (
              <Link
                key={sub.id}
                to={`/groups/${sub.enrollment.class?.id ?? ''}/subscriptions`}
                className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-hover transition-all hover:scale-[1.01]"
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
