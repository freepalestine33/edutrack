import { cn, getStatusBadgeClass } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
        getStatusBadgeClass(status),
      )}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full', {
          'bg-emerald-500': status === 'ACTIVE',
          'bg-amber-400': status === 'WARNING',
          'bg-red-500': status === 'EXPIRED',
        })}
      />
      {t(`status.${status}`)}
    </span>
  )
}
