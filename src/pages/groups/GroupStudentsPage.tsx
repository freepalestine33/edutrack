import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  CreditCard,
  RefreshCw,
  Trash2,
  Package,
} from 'lucide-react'
import { api } from '@/lib/api'
import { invalidateStudentData } from '@/lib/invalidate'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { cn } from '@/lib/utils'
import type { GroupContext } from './GroupLayout'

export function GroupStudentsPage() {
  const { groupId } = useParams()
  const { group } = useOutletContext<GroupContext>()
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', planId: '' })

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: api.getSubscriptionPlans,
  })

  // Fetch history for attendance dots
  const { data: sessions = [] } = useQuery({
    queryKey: ['group-history', groupId],
    queryFn: () => api.getGroupHistory(groupId!),
    enabled: !!groupId,
  })

  const addStudent = useMutation({
    mutationFn: (data: typeof form) =>
      api.addGroupStudent(groupId!, {
        ...data,
        planId: data.planId || undefined,
      }),
    onSuccess: () => {
      invalidateStudentData(qc, groupId)
      setShowForm(false)
      setForm({ firstName: '', lastName: '', phone: '', email: '', planId: '' })
    },
  })

  const removeStudent = useMutation({
    mutationFn: (enrollmentId: string) => api.deleteEnrollment(enrollmentId),
    onSuccess: () => invalidateStudentData(qc, groupId),
  })

  const enrollments = group.enrollments ?? []
  // Show the last 20 sessions (most recent first in API)
  const recentSessions = sessions.slice(0, 20)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{enrollments.length} {t('groups.students')}</p>
          <p className="text-xs text-muted mt-0.5">{t('groups.studentsDesc')}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          {t('groups.addStudent')}
        </Button>
      </div>

      {/* Add student form */}
      {showForm && (
        <Card className="border-accent/30 bg-accent/5 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-sm">{t('groups.addStudent')}</CardTitle>
          </CardHeader>
          <CardContent>
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
              <div className="sm:col-span-2">
                <Label>{t('groups.assignPlan')}</Label>
                <Select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
                  <option value="">{t('groups.noPlan')}</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.sessionsCount} sessions</option>
                  ))}
                </Select>
                {plans.length === 0 && (
                  <Link
                    to="/subscriptions"
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline mt-1.5"
                  >
                    <Package className="w-3.5 h-3.5" />
                    {t('plans.createFirstPlan', 'لم تقم بإنشاء أي باقة بعد؟ اضغط هنا لإنشاء باقة جديدة')}
                  </Link>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                disabled={!form.firstName || !form.lastName || addStudent.isPending}
                onClick={() => addStudent.mutate(form)}
              >
                {t('students.save')}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student list */}
      <div className="space-y-2">
        {enrollments.length === 0 && (
          <p className="text-center text-muted py-12">{t('groups.noStudents')}</p>
        )}

        {enrollments.map((enr) => {
          const sub = enr.subscriptions?.[0]
          const isExpanded = expandedId === enr.id
          const needsRenewal = sub?.status === 'EXPIRED' || sub?.status === 'WARNING'

          // Build attendance dots from history sessions for this student
          const attendanceDots = recentSessions.map((sess) => {
            const record = sess.attendances.find((a) => a.studentId === enr.student.id)
            return {
              sessionId: sess.id,
              date: sess.scheduledAt,
              status: record?.status ?? null,
              counted: record?.countedTowardSubscription ?? false,
            }
          })

          const presentTotal = attendanceDots.filter((d) => d.status === 'PRESENT').length
          const absentTotal = attendanceDots.filter((d) => d.status === 'ABSENT').length
          const markedTotal = presentTotal + absentTotal
          const attendanceRate = markedTotal > 0
            ? Math.round((presentTotal / markedTotal) * 100)
            : null

          return (
            <div
              key={enr.id}
              className={cn(
                'rounded-2xl border transition-all overflow-hidden',
                needsRenewal ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/60 bg-card',
              )}
            >
              {/* Student Row */}
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : enr.id)}
                aria-expanded={isExpanded}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    needsRenewal
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-accent-muted text-accent',
                  )}
                >
                  {enr.student.firstName.charAt(0)}{enr.student.lastName.charAt(0)}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground truncate">
                      {enr.student.firstName} {enr.student.lastName}
                    </p>
                    {sub && <StatusBadge status={sub.status} />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted flex-wrap">
                    {sub ? (
                      <span className={cn(needsRenewal && 'text-amber-500 font-medium')}>
                        {sub.sessionsRemaining}/{sub.sessionsTotal} sessions · {sub.plan?.name || 'Unknown Plan'}
                      </span>
                    ) : (
                      <span>{t('groups.noSubscription')}</span>
                    )}
                    {attendanceRate !== null && (
                      <span className="text-muted">· {t('groups.attendanceRate', { rate: attendanceRate })}</span>
                    )}
                  </div>
                </div>

                {/* Chevron + delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm(`${t('students.confirmRemove', 'Remove')} ${enr.student.firstName} ${enr.student.lastName}?`)) {
                        removeStudent.mutate(enr.id)
                      }
                    }}
                    disabled={removeStudent.isPending}
                    className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title={t('students.removeFromGroup', 'Remove from group')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="text-muted">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              {/* Expanded Accordion */}
              {isExpanded && (
                <div className="border-t border-border/40 bg-surface/30 p-4 space-y-5 animate-fade-in">
                  {/* Contact info */}
                  {(enr.student.phone || enr.student.email) && (
                    <div className="flex flex-wrap gap-4 text-sm">
                      {enr.student.phone && (
                        <a
                          href={`tel:${enr.student.phone}`}
                          className="flex items-center gap-1.5 text-accent hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {enr.student.phone}
                        </a>
                      )}
                      {enr.student.email && (
                        <a
                          href={`mailto:${enr.student.email}`}
                          className="flex items-center gap-1.5 text-accent hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {enr.student.email}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Subscription details */}
                  {sub && (
                    <div className="rounded-xl bg-surface border border-border/60 p-3">
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                        <CreditCard className="w-3.5 h-3.5" />
                        {t('groups.subscription')}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted">{t('groups.plan')}</p>
                          <p className="font-medium">{sub.plan?.name || 'Unknown Plan'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">{t('groups.sessionsLeftLabel')}</p>
                          <p className={cn('font-medium', needsRenewal && 'text-amber-500')}>
                            {sub.sessionsRemaining}/{sub.sessionsTotal}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">{t('groups.used')}</p>
                          <p className="font-medium">{sub.sessionsUsed}</p>
                        </div>
                        {sub.expiresAt && (
                          <div>
                            <p className="text-xs text-muted">{t('groups.expires')}</p>
                            <p className="font-medium text-xs">{new Date(sub.expiresAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                      {needsRenewal && (
                        <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                          <RefreshCw className="w-3.5 h-3.5" />
                          {t('groups.renewSubscription')} →
                        </div>
                      )}
                    </div>
                  )}


                  {/* Attendance history dots */}
                  {attendanceDots.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {t('groups.attendanceHistory')} ({attendanceDots.length} {t('groups.sessions')})
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            {t('groups.presentCount', { count: presentTotal })}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                            {t('groups.absentCount', { count: absentTotal })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {attendanceDots.map((dot) => (
                          <div
                            key={dot.sessionId}
                            title={`${dot.status ?? 'Unmarked'} · ${new Date(dot.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                            className={cn(
                              'w-7 h-7 rounded-full border flex items-center justify-center transition-transform hover:scale-110 cursor-default',
                              dot.status === 'PRESENT'
                                ? 'bg-emerald-500 border-emerald-600 shadow-sm shadow-emerald-500/20'
                                : dot.status === 'ABSENT'
                                  ? 'bg-red-500 border-red-600 shadow-sm shadow-red-500/20'
                                  : 'bg-surface border-border/50',
                            )}
                          >
                            {dot.status === null && (
                              <span className="text-xs text-muted font-bold">?</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted mt-2">{t('groups.hoverDotHint')}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted">{t('groups.noHistory')}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
