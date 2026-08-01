import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import i18n from '@/i18n'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function localeForCurrency(lang: string) {
  if (lang.startsWith('ar')) return 'ar-DZ'
  if (lang.startsWith('fr')) return 'fr-DZ'
  return 'en-US'
}

export function formatCurrency(amount: number, currency = 'DZD') {
  const locale = localeForCurrency(i18n.language || navigator.language || 'ar')
  return new Intl.NumberFormat(locale, {
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

export function getDayNames(): string[] {
  const lang = i18n.language || navigator.language || 'ar'
  // Use a fixed reference week (Sun 1970-01-04) and generate weekday names
  const base = new Date(Date.UTC(1970, 0, 4)) // Sunday
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(base)
    d.setUTCDate(base.getUTCDate() + i)
    return new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(d)
  })
}
