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
  { to: '/schedule', icon: Calendar, key: 'schedule' },
  { to: '/attendance', icon: ClipboardCheck, key: 'attendance' },
  { to: '/panel/manage-subscriptions-x99', icon: ShieldCheck, key: 'admin.requests', adminOnly: true },
  { to: '/settings', icon: Settings, key: 'settings' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const role = useAppStore((s) => s.role)
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  return (
    <>
      {!collapsed && (
        <aside className="fixed bottom-5 left-1/2 z-30 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 h-20 bg-sidebar/95 backdrop-blur-xl border border-border/60 rounded-full px-4 py-2 shadow-xl">
          <nav className="flex h-full items-center justify-between gap-2 overflow-x-auto">
            {navItems
              .filter((item) => (item.adminOnly ? role === 'ADMIN' : true))
              .map(({ to, icon: Icon, key }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  title={t(`nav.${key}`)}
                  className="inline-flex min-w-[70px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs sm:text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground hover:bg-surface/70"
                >
                  {({ isActive }) => (
                    <div
                      className={cn(
                        'flex flex-col items-center justify-center gap-1',
                        isActive ? 'text-accent' : 'text-muted',
                      )}
                    >
                      <Icon className={cn('w-6 h-6 sm:w-5 sm:h-5', isActive ? 'text-accent' : 'text-muted')} />
                      <span className="whitespace-nowrap">{t(`nav.${key}`)}</span>
                    </div>
                  )}
                </NavLink>
              ))}
          </nav>
        </aside>
      )}

      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-xl transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
      >
        {collapsed ? <ChevronsRight className="w-6 h-6" /> : <ChevronsLeft className="w-6 h-6" />}
      </button>
    </>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-28">
      <main className="min-h-screen overflow-auto mesh-bg">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">{children}</div>
      </main>
      <Sidebar />
    </div>
  )
}
