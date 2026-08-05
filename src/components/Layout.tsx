import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Layers,
  Calendar,
  Settings,
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

  return (
    <aside className="fixed bottom-3 sm:bottom-5 left-1/2 z-30 w-[calc(100%-1.25rem)] sm:w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 h-16 sm:h-20 bg-sidebar/95 backdrop-blur-xl border border-border/60 rounded-full px-2 sm:px-4 py-1 sm:py-2 shadow-2xl transition-all duration-300">
      <nav className="flex h-full items-center justify-around sm:justify-between gap-1 sm:gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navItems
          .filter((item) => (item.adminOnly ? role === 'ADMIN' : true))
          .map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={t(`nav.${key}`)}
              className="inline-flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-2xl px-1 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs md:text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground hover:bg-surface/70"
            >
              {({ isActive }) => (
                <div
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-full',
                    isActive ? 'text-accent' : 'text-muted',
                  )}
                >
                  <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform duration-200', isActive ? 'text-accent scale-110' : 'text-muted')} />
                  <span className="truncate max-w-full text-center text-[10px] sm:text-xs font-medium leading-tight whitespace-nowrap">{t(`nav.${key}`)}</span>
                </div>
              )}
            </NavLink>
          ))}
      </nav>
    </aside>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-28">
      <main className="min-h-screen overflow-auto mesh-bg">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">{children}</div>
      </main>
      <Sidebar />
    </div>
  )
}
