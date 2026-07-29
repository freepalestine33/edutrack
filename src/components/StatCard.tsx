import { cn, formatCurrency } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent'
  subtitle?: string
  icon?: LucideIcon
}

const variantStyles = {
  default: 'from-surface to-card',
  success: 'from-emerald-500/10 to-card dark:from-emerald-500/15',
  warning: 'from-amber-500/10 to-card dark:from-amber-500/15',
  danger: 'from-red-500/10 to-card dark:from-red-500/15',
  accent: 'from-accent-muted to-card',
}

const valueStyles = {
  default: 'text-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  accent: 'text-accent',
}

const iconStyles = {
  default: 'bg-surface text-muted',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
  accent: 'bg-accent-muted text-accent',
}

export function StatCard({ label, value, variant = 'default', subtitle, icon: Icon }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/60 p-5 card-shadow transition-all duration-300',
        'bg-gradient-to-br hover:card-shadow-lg hover:-translate-y-0.5',
        variantStyles[variant],
      )}
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-accent/5 to-transparent blur-2xl pointer-events-none" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted font-medium">{label}</p>
          <p className={cn('text-2xl font-semibold mt-1.5 tracking-tight', valueStyles[variant])}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-sm', iconStyles[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}

export function MoneyStat({ label, amount, currency = 'DZD', icon }: { label: string; amount: number; currency?: string; icon?: LucideIcon }) {
  return <StatCard label={label} value={formatCurrency(amount, currency)} icon={icon} variant="accent" />
}
