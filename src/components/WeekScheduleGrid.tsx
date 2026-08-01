import { Plus, Trash2, Repeat, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { ScheduleItem } from '@/lib/api'

interface WeekScheduleGridProps {
  schedules: ScheduleItem[]
  onAddDay?: (dayOfWeek: number) => void
  onDelete?: (id: string) => void
  onTogglePermanent?: (id: string, currentIsPermanent: boolean) => void
  showGroup?: boolean
  readOnly?: boolean
}

export function WeekScheduleGrid({
  schedules,
  onAddDay,
  onDelete,
  onTogglePermanent,
  showGroup = false,
  readOnly = false,
}: WeekScheduleGridProps) {
  const { t, i18n } = useTranslation()
  const today = new Date().getDay()

  const weekBase = (() => {
    const d = new Date()
    const diff = d.getDate() - d.getDay() // Sunday of current week
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  })()

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  const dayOrder =
    i18n.language === 'ar'
      ? [6, 0, 1, 2, 3, 4, 5]
      : [0, 1, 2, 3, 4, 5, 6]

  const byDay = schedules.reduce<Record<number, ScheduleItem[]>>((acc, s) => {
    if (!acc[s.dayOfWeek]) acc[s.dayOfWeek] = []
    acc[s.dayOfWeek].push(s)
    return acc
  }, {})

  Object.values(byDay).forEach((list) =>
    list.sort((a, b) => a.startTime.localeCompare(b.startTime)),
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {dayOrder.map((day) => {
        const slots = byDay[day] ?? []
        const isToday = day === today

        return (
          <div
            key={day}
            className={cn(
              'flex flex-col rounded-2xl border min-h-[160px] transition-colors',
              isToday
                ? 'border-accent/50 bg-accent-muted/30'
                : 'border-border/60 bg-card',
            )}
          >
            <div
              className={cn(
                'px-3 py-2.5 border-b border-border/40 flex items-center justify-between',
                isToday && 'bg-accent/10',
              )}
            >
              <div>
                <p className={cn('text-sm font-semibold', isToday ? 'text-accent' : 'text-foreground')}>
                  {dateFormatter.format(new Date(weekBase.getFullYear(), weekBase.getMonth(), weekBase.getDate() + day))}
                </p>
                {isToday && (
                  <p className="text-[10px] text-accent font-medium uppercase tracking-wide">
                    {t('schedule.today')}
                  </p>
                )}
              </div>
              {!readOnly && onAddDay && (
                <button
                  onClick={() => onAddDay(day)}
                  className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-accent transition-colors"
                  title={t('groups.addSlot')}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 p-2 space-y-2">
              {slots.map((slot) => {
                const isPermanent = slot.isPermanent !== false
                return (
                  <div
                    key={slot.id}
                    className="group relative p-2.5 rounded-xl bg-surface border border-border/40 hover:border-accent/30 transition-colors"
                  >
                    {showGroup && slot.class && (
                      <Link
                        to={`/groups/${slot.class.id}/schedule`}
                        className="text-xs font-semibold text-accent hover:underline block mb-1"
                      >
                        {slot.class.name}
                      </Link>
                    )}
                    <p className="text-sm font-medium text-foreground tabular-nums">
                      {slot.startTime} – {slot.endTime}
                    </p>
                    {slot.notes && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">{slot.notes}</p>
                    )}

                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={readOnly || !onTogglePermanent}
                        onClick={() => onTogglePermanent?.(slot.id, isPermanent)}
                        title={isPermanent ? t('schedule.permanentDesc') : t('schedule.singleSessionDesc')}
                        className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors',
                          isPermanent
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                            : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20',
                          (!readOnly && onTogglePermanent) && 'cursor-pointer'
                        )}
                      >
                        {isPermanent ? (
                          <>
                            <Repeat className="w-2.5 h-2.5" />
                            {t('schedule.permanent')}
                          </>
                        ) : (
                          <>
                            <Clock className="w-2.5 h-2.5" />
                            {t('schedule.singleSession')}
                          </>
                        )}
                      </button>
                    </div>

                    {!readOnly && onDelete && (
                      <button
                        onClick={() => onDelete(slot.id)}
                        className="absolute top-2 end-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-card text-muted hover:text-danger transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
              {!slots.length && (
                <p className="text-xs text-muted text-center py-6 px-1">{t('schedule.noSessions')}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
