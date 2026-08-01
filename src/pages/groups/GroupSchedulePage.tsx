import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { WeekScheduleGrid } from '@/components/WeekScheduleGrid'
import { getDayNames } from '@/lib/utils'
import type { GroupContext } from './GroupLayout'

export function GroupSchedulePage() {
  const { groupId } = useParams()
  const { group } = useOutletContext<GroupContext>()
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ dayOfWeek: 5, startTime: '14:00', endTime: '16:00', notes: '', isPermanent: true })

  const addSchedule = useMutation({
    mutationFn: (data: typeof form) => api.addGroupSchedule(groupId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', groupId] })
      qc.invalidateQueries({ queryKey: ['schedules'] })
      setShowForm(false)
      setForm({ dayOfWeek: 5, startTime: '14:00', endTime: '16:00', notes: '', isPermanent: true })
    },
  })

  const togglePermanentMutation = useMutation({
    mutationFn: ({ id, isPermanent }: { id: string; isPermanent: boolean }) =>
      api.updateSchedule(id, { isPermanent }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', groupId] })
      qc.invalidateQueries({ queryKey: ['schedules'] })
    },
  })

  const removeSchedule = useMutation({
    mutationFn: (id: string) => api.deleteSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', groupId] })
      qc.invalidateQueries({ queryKey: ['schedules'] })
    },
  })

  const openAddForDay = (dayOfWeek: number) => {
    setForm((f) => ({ ...f, dayOfWeek }))
    setShowForm(true)
  }

  const schedules = group.schedules ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('schedule.weeklyPlan')}</h2>
        <p className="text-sm text-muted mt-1">{t('groups.scheduleDesc')}</p>
      </div>

      <WeekScheduleGrid
        schedules={schedules}
        onAddDay={openAddForDay}
        onDelete={(id) => removeSchedule.mutate(id)}
        onTogglePermanent={(id, current) =>
          togglePermanentMutation.mutate({ id, isPermanent: !current })
        }
      />

      {showForm && (
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <h3 className="font-medium text-foreground mb-4">
              {t('schedule.addSessionOn')} {getDayNames()[form.dayOfWeek]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  id="groupIsPermanent"
                  checked={form.isPermanent}
                  onChange={(e) => setForm({ ...form, isPermanent: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                />
                <label htmlFor="groupIsPermanent" className="text-sm font-medium text-foreground cursor-pointer select-none">
                  {t('schedule.isPermanent')}
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={() => addSchedule.mutate(form)} disabled={addSchedule.isPending}>
                {t('schedule.createSession')}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
