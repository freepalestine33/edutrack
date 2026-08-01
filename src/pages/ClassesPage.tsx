import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader, LoadingState } from '@/components/PageHeader'
import { getDayNames } from '@/lib/utils'

export function ClassesPage() {
  const { t } = useTranslation()
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: api.getClasses,
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.classes')} />

      <div className="grid gap-4 md:grid-cols-2">
        {classes.map((cls) => (
          <Card key={cls.id} className="hover:card-shadow-lg transition-all duration-200">
            <CardContent className="py-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-accent uppercase tracking-wide">
                    {cls.subject?.name}
                  </p>
                  <h3 className="font-semibold text-foreground mt-1">{cls.name}</h3>
                  <p className="text-sm text-muted mt-1">{cls.teacher?.name}</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-surface text-muted">
                  {cls._count?.enrollments ?? 0} students
                </span>
              </div>
              {cls.schedules && cls.schedules.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/40">
                  {cls.schedules.map((s) => (
                    <span
                      key={s.id}
                      className="text-xs px-2.5 py-1 rounded-lg bg-surface text-muted font-medium"
                    >
                      {getDayNames()[s.dayOfWeek]} {s.startTime}–{s.endTime}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
