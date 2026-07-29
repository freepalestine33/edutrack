import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Users, Calendar, ChevronRight, ClipboardCheck, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Label, Select } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader, LoadingState } from '@/components/PageHeader'
import { DAY_NAMES } from '@/lib/utils'

export function GroupsListPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [level, setLevel] = useState('')
  const [year, setYear] = useState('')
  const [section, setSection] = useState('')

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: api.getGroups,
  })

  const generatedName = [level, year, section].filter(Boolean).join(' - ')

  const createGroup = useMutation({
    mutationFn: () => api.createGroup({ name: generatedName, level, year, section }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setShowForm(false)
      setLevel('')
      setYear('')
      setSection('')
    },
  })

  const deleteGroup = useMutation({
    mutationFn: (id: string) => api.deleteGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const today = new Date().getDay()

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('groups.title')}
        description={t('groups.subtitle')}
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />
            {t('groups.create')}
          </Button>
        }
      />

      {showForm && (
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3 mt-1.5">
              <div>
                <Label>المستوى</Label>
                <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">اختر المستوى</option>
                  <option value="ابتدائي">ابتدائي</option>
                  <option value="متوسط">متوسط</option>
                  <option value="ثانوي">ثانوي</option>
                </Select>
              </div>
              <div>
                <Label>السنة</Label>
                <Select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">اختر السنة</option>
                  <option value="الأولى">الأولى</option>
                  <option value="الثانية">الثانية</option>
                  <option value="الثالثة">الثالثة</option>
                  <option value="الرابعة">الرابعة</option>
                  <option value="الخامسة">الخامسة</option>
                  <option value="السادسة">السادسة</option>
                </Select>
              </div>
              <div>
                <Label>الفوج</Label>
                <Select value={section} onChange={(e) => setSection(e.target.value)}>
                  <option value="">اختر الفوج</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </Select>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border/60 bg-surface px-3 py-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted">اسم المجموعة</p>
              <p className="mt-1 font-medium text-foreground">{generatedName || '...'} </p>
            </div>

            <div className="flex gap-3 mt-4">
              <Button disabled={!level || !year || !section || createGroup.isPending} onClick={() => createGroup.mutate()}>
                {t('common.save')}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => {
          const todaySlots = group.schedules?.filter((s) => s.dayOfWeek === today) ?? []
          const hasSessionToday = (group.sessions?.length ?? 0) > 0

          return (
            <Link key={group.id} to={`/groups/${group.id}`} className="block group">
              <Card className="h-full hover:card-shadow-lg transition-all duration-200 group-hover:border-accent/40">
                <CardContent className="py-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-accent uppercase tracking-wide">
                        {group.subject?.name}
                      </p>
                      <h3 className="text-xl font-semibold text-foreground mt-1">{group.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (window.confirm(`هل أنت تأكد من رغبتك في حذف المجموعة "${group.name}"؟`)) {
                            deleteGroup.mutate(group.id)
                          }
                        }}
                        disabled={deleteGroup.isPending}
                        className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="حذف المجموعة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-muted group-hover:text-accent transition-colors" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {group._count?.enrollments ?? 0}
                    </span>
                    {todaySlots.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-accent">
                        <Calendar className="w-4 h-4" />
                        {todaySlots.map((s) => s.startTime).join(', ')}
                      </span>
                    )}
                    {hasSessionToday && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <ClipboardCheck className="w-4 h-4" />
                        {t('groups.sessionStarted')}
                      </span>
                    )}
                  </div>

                  {group.schedules && group.schedules.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border/40">
                      {[...(group.schedules ?? [])]
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .slice(0, 4)
                        .map((s) => (
                          <span key={s.id} className="text-xs px-2 py-0.5 rounded-md bg-surface text-muted">
                            {DAY_NAMES[s.dayOfWeek].slice(0, 3)} {s.startTime}
                          </span>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {!groups.length && (
        <p className="text-center text-muted py-16">{t('groups.noGroups')}</p>
      )}
    </div>
  )
}
