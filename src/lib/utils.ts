import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'DZD') {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-500 shadow-[0_0_8px_rgba(52,199,89,0.4)]'
    case 'WARNING':
      return 'bg-amber-400 shadow-[0_0_8px_rgba(255,159,10,0.4)]'
    case 'EXPIRED':
      return 'bg-red-500 shadow-[0_0_8px_rgba(255,59,48,0.4)]'
    default:
      return 'bg-gray-400'
  }
}

export function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20'
    case 'WARNING':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20'
    case 'EXPIRED':
      return 'bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20'
    default:
      return 'bg-surface text-muted ring-border'
  }
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
