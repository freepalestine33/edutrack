import { NavLink, Outlet, useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Calendar,
  Users,
  ClipboardCheck,
  CreditCard,
  LayoutGrid,
  Play,
  Trash2,
  Clock,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LoadingState } from '@/components/PageHeader'

export function GroupLayout() {
  const { groupId } = useParams<{ groupId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => api.getGroup(groupId!),
    enabled: !!groupId,
  })

  const deleteGroup = useMutation({
    mutationFn: (id: string) => api.deleteGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      navigate('/groups')
    },
  })

  // Poll the session to know if one is active — drives the live indicator on the Session tab
  const { data: session } = useQuery({
    queryKey: ['group-session', groupId],
    queryFn: () => api.getGroupSession(groupId!),
    enabled: !!groupId,
    refetchInterval: 15_000,
  })

  if (isLoading) return <LoadingState />
  if (!group) return <p className="text-muted">{t('groups.notFound')}</p>

  const today = new Date().getDay()
  const todaySlots = group.schedules?.filter((s) => s.dayOfWeek === today) ?? []
  const sessionActive = !!session && session.status === 'in_progress'

  const tabs = [
    { to: '', icon: LayoutGrid, key: 'overview', end: true },
    { to: 'session', icon: ClipboardCheck, key: 'session', badge: sessionActive },
    { to: 'students', icon: Users, key: 'students' },
    { to: 'subscriptions', icon: CreditCard, key: 'subscriptions' },
    { to: 'schedule', icon: Calendar, key: 'schedule' },
    { to: 'history', icon: Clock, key: 'history' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/groups"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('groups.backToGroups')}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-wide">
              {group.subject?.name}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-1">
              {group.name}
            </h1>
            <p className="text-sm text-muted mt-1">
              {group._count?.enrollments ?? group.enrollments?.length ?? 0} {t('groups.students')}
              {todaySlots.length > 0 && (
                <> · {t('groups.scheduledToday')}: {todaySlots.map((s) => `${s.startTime}–${s.endTime}`).join(', ')}</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`هل أنت تأكد من رغبتك في حذف المجموعة "${group.name}"؟`)) {
                  deleteGroup.mutate(group.id)
                }
              }}
              disabled={deleteGroup.isPending}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors shadow-sm"
              title="حذف المجموعة"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>

            {/* Session status button — goes to Session tab */}
            <NavLink
              to={`/groups/${groupId}/session`}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm',
                sessionActive
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                  : 'bg-accent text-white hover:bg-accent-hover',
              )}
            >
              {sessionActive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  {t('groups.sessionInProgress')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {t('groups.startSession')}
                </>
              )}
            </NavLink>
          </div>
        </div>
      </div>

      <nav className="flex gap-1 p-1 rounded-xl bg-surface border border-border overflow-x-auto">
        {tabs.map(({ to, icon: Icon, key, end, badge }) => (
          <NavLink
            key={key}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground',
              )
            }
          >
            <Icon className="w-4 h-4" />
            {t(`groups.tabs.${key}`)}
            {badge && (
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ group, session }} />
    </div>
  )
}

export type GroupContext = {
  group: Awaited<ReturnType<typeof api.getGroup>>
  session?: Awaited<ReturnType<typeof api.getGroupSession>>
}

