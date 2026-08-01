import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { invalidateStudentData } from '@/lib/invalidate'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { PageHeader, LoadingState, EmptyState } from '@/components/PageHeader'

export function StudentsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', groupId: '' })
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: api.getStudents,
  })
  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: api.getGroups,
  })

  const createMutation = useMutation<any, any, typeof form>({
    mutationFn: (payload: typeof form) =>
      payload.groupId
        ? api.addGroupStudent(payload.groupId, {
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone,
            email: payload.email,
          })
        : api.createStudent({
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone,
            email: payload.email,
          }),
    onSuccess: () => {
      invalidateStudentData(qc)
      setForm({ firstName: '', lastName: '', phone: '', email: '', groupId: '' })
      setShowForm(false)
    },
  })

  const removeEnrollment = useMutation({
    mutationFn: (enrollmentId: string) => api.deleteEnrollment(enrollmentId),
    onSuccess: () => invalidateStudentData(qc),
  })

  const removeStudent = useMutation({
    mutationFn: (studentId: string) => api.deleteStudent(studentId),
    onSuccess: () => invalidateStudentData(qc),
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('students.title')}
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />
            {t('students.add')}
          </Button>
        }
      />

      {showForm && (
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('students.firstName')}</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <Label>{t('students.lastName')}</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div>
                <Label>{t('students.phone')}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>{t('students.email')}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>{t('students.group')}</Label>
                <Select value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })}>
                  <option value="">{t('students.selectGroup')}</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button disabled={!form.firstName || !form.lastName || createMutation.isPending} onClick={() => createMutation.mutate(form)}>
                {t('students.save')}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {groups.length > 0 && groups.map((group) => {
          const members = students.filter((s) => s.enrollments?.some((e) => e.class?.id === group.id))
          const isOpen = openGroup === group.id
          return (
            <div key={group.id} className="border-b border-border/40 pb-4 mb-4">
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : group.id)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-foreground">{group.name}</div>
                  <div className="text-xs text-muted">· {members.length}</div>
                </div>
                <div className="text-muted">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {members.map((student) => {
                    const enrollment = student.enrollments?.find((e) => e.class?.id === group.id)
                    const sub = enrollment?.subscriptions?.[0]
                    return (
                      <Card key={student.id} className="hover:card-shadow-lg transition-shadow duration-200">
                        <CardContent className="py-4 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-accent-muted flex items-center justify-center text-accent text-sm font-semibold shrink-0">
                              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{student.firstName} {student.lastName}</p>
                              <p className="text-sm text-muted">{[student.phone, student.email].filter(Boolean).join(' · ')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {sub && <StatusBadge status={sub.status} />}
                            {enrollment && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`${t('students.confirmRemove', 'Remove')} ${student.firstName}?`)) {
                                    removeEnrollment.mutate(enrollment.id)
                                  }
                                }}
                                className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10"
                                title={t('students.removeFromGroup', 'Remove from group')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                  {members.length === 0 && <p className="text-sm text-muted">{t('students.noStudentsInGroup')}</p>}
                </div>
              )}
            </div>
          )
        })}

        {/* Ungrouped students */}
        {(() => {
          const ungrouped = students.filter((s) => !(s.enrollments && s.enrollments.length > 0))
          if (ungrouped.length === 0) return null
          return (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">{t('students.ungrouped')} <span className="text-xs text-muted">· {ungrouped.length}</span></h3>
              <div className="grid gap-3 md:grid-cols-2">
                {ungrouped.map((student) => (
                  <Card key={student.id} className="hover:card-shadow-lg transition-shadow duration-200">
                    <CardContent className="py-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-accent-muted flex items-center justify-center text-accent text-sm font-semibold shrink-0">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-muted">{[student.phone, student.email].filter(Boolean).join(' · ')}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`${t('students.confirmDelete', 'Delete')} ${student.firstName} ${student.lastName}?`)) {
                            removeStudent.mutate(student.id)
                          }
                        }}
                        className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 shrink-0"
                        title={t('students.delete', 'Delete student')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })()}

        {students.length === 0 && <EmptyState message={t('students.noStudents')} />}
      </div>
    </div>
  )
}
