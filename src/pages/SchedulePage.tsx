import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader, LoadingState } from '@/components/PageHeader'
import { WeekScheduleGrid } from '@/components/WeekScheduleGrid'
import { getDayNames } from '@/lib/utils'

export function SchedulePage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [form, setForm] = useState({
    groupId: '',
    teacherId: '',
    dayOfWeek: 5,
    startTime: '14:00',
    endTime: '16:00',
    notes: '',
    isPermanent: true,
  })

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: api.getAllSchedules,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: api.getGroups,
  })

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: api.getTeachers,
  })

  const addSchedule = useMutation({
    mutationFn: () =>
      api.addGroupSchedule(form.groupId, {
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes,
        teacherId: form.teacherId || undefined,
        isPermanent: form.isPermanent,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] })
      qc.invalidateQueries({ queryKey: ['groups'] })
      qc.invalidateQueries({ queryKey: ['group'] })
      setShowForm(false)
    },
  })

  const togglePermanentMutation = useMutation({
    mutationFn: ({ id, isPermanent }: { id: string; isPermanent: boolean }) =>
      api.updateSchedule(id, { isPermanent }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] })
      qc.invalidateQueries({ queryKey: ['groups'] })
      qc.invalidateQueries({ queryKey: ['group'] })
    },
  })

  const removeSchedule = useMutation({
    mutationFn: (id: string) => api.deleteSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] })
      qc.invalidateQueries({ queryKey: ['groups'] })
      qc.invalidateQueries({ queryKey: ['group'] })
    },
  })

  const filtered =
    filterGroup === 'all'
      ? schedules
      : schedules.filter((s) => s.class?.id === filterGroup)

  const openAddForDay = (dayOfWeek: number) => {
    setForm((f) => ({
      ...f,
      dayOfWeek,
      groupId: filterGroup !== 'all' ? filterGroup : groups[0]?.id ?? '',
    }))
    setShowForm(true)
  }

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('schedule.title')}
        description={t('schedule.subtitle')}
        action={
          <Button
            onClick={() => {
              setForm((f) => ({ ...f, groupId: groups[0]?.id ?? '' }))
              setShowForm(true)
            }}
            disabled={!groups.length}
          >
            <Plus className="w-4 h-4" />
            {t('schedule.addSession')}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Label className="mb-0">{t('schedule.filterGroup')}</Label>
        <Select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="w-auto min-w-[160px]"
        >
          <option value="all">{t('schedule.allGroups')}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>

      <WeekScheduleGrid
        schedules={filtered}
        showGroup={filterGroup === 'all'}
        onAddDay={openAddForDay}
        onDelete={(id) => removeSchedule.mutate(id)}
        onTogglePermanent={(id, current) =>
          togglePermanentMutation.mutate({ id, isPermanent: !current })
        }
      />

      {showForm && (
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <h3 className="font-medium text-foreground mb-4">{t('schedule.addSession')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>{t('schedule.selectGroup')}</Label>
                <Select
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                >
                  <option value="">{t('schedule.selectGroup')}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>
              {teachers.length > 0 && (
                <div className="sm:col-span-2">
                  <Label>{t('schedule.selectTeacher')}</Label>
                  <Select
                    value={form.teacherId}
                    onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  >
                    <option value="">{t('schedule.noTeacher')}</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <div>
                <Label>{t('groups.dayOfWeek')}</Label>
                <Select
                  value={form.dayOfWeek}
                  onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
                >
                  {getDayNames().map((day, i) => (
                    <option key={i} value={i}>
                      {day}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>{t('groups.startTime')}</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('groups.endTime')}</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>{t('groups.notes')}</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder={t('groups.notesPlaceholder')}
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="isPermanent"
                  checked={form.isPermanent}
                  onChange={(e) => setForm({ ...form, isPermanent: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                />
                <label htmlFor="isPermanent" className="text-sm font-medium text-foreground cursor-pointer select-none">
                  {t('schedule.isPermanent')}
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                disabled={!form.groupId || addSchedule.isPending}
                onClick={() => addSchedule.mutate()}
              >
                {t('schedule.createSession')}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!groups.length && (
        <p className="text-center text-muted py-8">{t('groups.noGroups')}</p>
      )}
    </div>
  )
}
