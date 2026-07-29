import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Layers,
  Calendar,
  Wallet,
  Settings,
  GraduationCap,
  DollarSign,
  ChevronsLeft,
  ChevronsRight,
  Users,
  CreditCard,
  ClipboardCheck,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app'

interface NavItem {
  to: string
  icon: LucideIcon
  key: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/groups', icon: Layers, key: 'groups' },
  { to: '/students', icon: Users, key: 'students' },
  { to: '/schedule', icon: Calendar, key: 'schedule' },
  { to: '/attendance', icon: ClipboardCheck, key: 'attendance' },
  { to: '/subscriptions', icon: CreditCard, key: 'subscriptions' },
  { to: '/finance', icon: Wallet, key: 'finance' },
  { to: '/upgrade', icon: DollarSign, key: 'upgrade' },
  { to: '/panel/manage-subscriptions-x99', icon: ShieldCheck, key: 'admin.requests', adminOnly: true },
  { to: '/settings', icon: Settings, key: 'settings' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const orgName = useAppStore((s) => s.orgName)
  const userName = useAppStore((s) => s.userName)
  const role = useAppStore((s) => s.role)

  const initials = userName
    ? userName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('')
    : ''

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen bg-sidebar/80 backdrop-blur-xl border-r border-border/70 flex flex-col shrink-0 transition-[width] duration-300 ease-in-out z-30',
        collapsed ? 'w-[76px]' : 'w-[260px]',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center gap-3 h-16 border-b border-border/50 shrink-0',
          collapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div
            className={cn(
              'min-w-0 transition-all duration-200',
              collapsed ? 'opacity-0 max-w-0 overflow-hidden' : 'opacity-100 max-w-full',
            )}
          >
            <h1 className="font-semibold text-foreground tracking-tight truncate leading-tight">{t('app.name')}</h1>
            {orgName && <p className="text-xs text-muted truncate">{orgName}</p>}
          </div>
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            title={t('sidebar.collapse')}
            aria-label={t('sidebar.collapse')}
            aria-expanded={!collapsed}
            className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5 sidebar-scroll">
        {navItems
          .filter((item) => (item.adminOnly ? role === 'ADMIN' : true))
          .map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to} end={to === '/'} title={t(`nav.${key}`)} className="block">
              {({ isActive }) => (
                <div
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-200',
                    collapsed ? 'justify-center px-0 py-3 my-0.5' : 'px-3 py-2.5',
                    isActive
                      ? 'text-white'
                      : 'text-muted hover:text-foreground hover:bg-surface/60',
                  )}
                >
                  {isActive && (
                    <span
                      className={cn(
                        'absolute inset-0 rounded-xl bg-gradient-to-br from-accent to-accent-hover card-shadow transition-opacity duration-200',
                      )}
                      aria-hidden
                    />
                  )}
                  <Icon className={cn('relative z-10 shrink-0 transition-transform duration-200', collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]', !isActive && 'group-hover:scale-110')} />
                  <span
                    className={cn(
                      'relative z-10 whitespace-nowrap transition-all duration-200',
                      collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto',
                    )}
                  >
                    {t(`nav.${key}`)}
                  </span>
                  {/* Collapsed active indicator */}
                  {collapsed && isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-white" aria-hidden />
                  )}
                </div>
              )}
            </NavLink>
          ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-border/50 p-2 shrink-0">
        {collapsed ? (
          <>
            {/* Collapsed: just the avatar, centered. Hover reveals a tooltip via title attr on the button */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={t('sidebar.expand')}
              aria-label={t('sidebar.expand')}
              aria-expanded={!collapsed}
              className="w-full flex items-center justify-center"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-muted to-accent/20 flex items-center justify-center text-accent text-xs font-semibold ring-1 ring-border/50">
                {initials || '?'}
              </div>
            </button>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={t('sidebar.expand')}
              className="mt-1 w-full inline-flex items-center justify-center h-8 rounded-lg text-muted hover:bg-surface hover:text-accent transition"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-surface/60 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-muted to-accent/20 flex items-center justify-center text-accent text-xs font-semibold ring-1 ring-border/50 shrink-0">
              {initials || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate leading-tight">{userName || '—'}</p>
              <p className="text-[11px] text-muted truncate">
                {role === 'ADMIN' ? t('roles.admin') : role === 'TEACHER' ? t('roles.teacher') : t('roles.tutor')}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto mesh-bg">
        <div className="max-w-6xl mx-auto p-6 sm:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  )
}
