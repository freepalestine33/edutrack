import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Phone, RefreshCw, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, type Subscription, type SubscriptionPlan } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Label, Select } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import React, { useState } from 'react'

interface SectionProps {
  title: string
  items: Subscription[]
  variant: 'danger' | 'warning' | 'success'
  visibleCount: number
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>
  renewFor: string | null
  setRenewFor: (id: string | null) => void
  planSelection: Record<string, string>
  setPlanSelection: React.Dispatch<React.SetStateAction<Record<string, string>>>
  extraSessions: Record<string, number>
  setExtraSessions: React.Dispatch<React.SetStateAction<Record<string, number>>>
  plans: SubscriptionPlan[]
  renew: {
    isPending: boolean
    mutate: (data: { enrollmentId: string; subscriptionId?: string; planId?: string; extraSessions?: number }) => void
  }
  t: (key: string, options?: any) => string
}

function Section({
  title,
  items,
  variant,
  visibleCount,
  setVisibleCount,
  renewFor,
  setRenewFor,
  planSelection,
  setPlanSelection,
  extraSessions,
  setExtraSessions,
  plans,
  renew,
  t,
}: SectionProps) {
  if (!items.length) return null
  const borderColor =
    variant === 'danger' ? 'border-red-500/30' : variant === 'warning' ? 'border-amber-500/30' : 'border-border/30'
  const visibleItems = items.slice(0, visibleCount)
  const hasMore = items.length > visibleCount

  return (
    <Card className={`border ${borderColor}`}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleItems.map((sub) => {
          const selectedPlanId = planSelection[sub.enrollment.id] ?? sub.plan?.id ?? plans[0]?.id ?? ''
          const currentExtras = extraSessions[sub.enrollment.id] ?? 0

          return (
            <div key={sub.id} className="p-4 rounded-xl bg-surface">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    {sub.enrollment.student.firstName} {sub.enrollment.student.lastName}
                  </p>
                  <p className="text-sm text-muted mt-0.5">
                    {sub.plan?.name || 'Unknown Plan'} · {t('dashboard.sessionsLeft', { count: sub.sessionsRemaining })}
                  </p>
                  {sub.expiresAt && (
                    <p className="text-xs text-muted mt-0.5">
                      {t('groups.expires')}: {new Date(sub.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                  {sub.enrollment.student.phone && (
                    <a
                      href={`tel:${sub.enrollment.student.phone}`}
                      className="inline-flex items-center gap-1 text-xs text-accent mt-2 hover:underline"
                    >
                      <Phone className="w-3 h-3" />
                      {sub.enrollment.student.phone}
                    </a>
                  )}
                </div>
                <StatusBadge status={sub.status} />
              </div>

              {sub && (
                <div className="mt-3 pt-3 border-t border-border/40">
                  {renewFor === sub.enrollment.id ? (
                    <div className="space-y-3">
                      <div className="w-full">
                        <Label className="whitespace-nowrap">{t('groups.selectPlan')}</Label>
                        <Select
                          value={selectedPlanId}
                          onChange={(e) =>
                            setPlanSelection((current) => ({
                              ...current,
                              [sub.enrollment.id]: e.target.value,
                            }))
                          }
                        >
                          {plans.length === 0 ? (
                            <option value="" disabled>
                              {t('plans.noPlansYet', 'لا توجد باقات — أنشئ باقتك الأولى')}
                            </option>
                          ) : (
                            <>
                              <option value="" disabled>
                                {t('groups.selectPlanPlaceholder', 'اختر الباقة')}
                              </option>
                              {plans.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name || 'Plan'} — {formatCurrency(p.price)}
                                </option>
                              ))}
                            </>
                          )}
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

                      <div className="flex flex-wrap items-end gap-2.5 justify-between sm:justify-start">
                        <div className="w-32 flex-1 sm:flex-none">
                          <Label className="whitespace-nowrap">{t('groups.extraSessions', 'حصص إضافية')}</Label>
                          <input
                            type="number"
                            min={0}
                            className="flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                            value={currentExtras}
                            onChange={(e) =>
                              setExtraSessions((cur) => ({ ...cur, [sub.enrollment.id]: Number(e.target.value) }))
                            }
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={renew.isPending || (!selectedPlanId && !(currentExtras > 0))}
                            onClick={() => {
                              if (!selectedPlanId && !(currentExtras > 0)) return
                              renew.mutate({
                                enrollmentId: sub.enrollment.id,
                                subscriptionId: sub.id,
                                planId: selectedPlanId,
                                extraSessions: currentExtras,
                              })
                            }}
                          >
                            {t('groups.renew')}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setRenewFor(null)}>
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                      {selectedPlanId && (() => {
                        const selectedPlan = plans.find((p) => p.id === selectedPlanId)
                        if (!selectedPlan) return null
                        const carryOver = Math.max(0, sub.sessionsRemaining)
                        const total = carryOver + selectedPlan.sessionsCount
                        return (
                          <p className="text-xs text-muted">
                            {t('groups.renewPreview', {
                              carryOver,
                              added: selectedPlan.sessionsCount,
                              total,
                            })}
                          </p>
                        )
                      })()}
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setRenewFor(sub.enrollment.id)}
                    >
                      <RefreshCw className="w-3 h-3" />
                      {t('groups.renewSubscription')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button size="sm" variant="secondary" onClick={() => setVisibleCount((count) => count + 100)}>
              {t('groups.loadMore', 'عرض المزيد')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function GroupSubscriptionsPage() {
  const { groupId } = useParams()
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [renewFor, setRenewFor] = useState<string | null>(null)
  const [planSelection, setPlanSelection] = useState<Record<string, string>>({})
  const [extraSessions, setExtraSessions] = useState<Record<string, number>>({})

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: api.getSubscriptionPlans,
  })

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['group-subscriptions', groupId],
    queryFn: () => api.getGroupSubscriptions(groupId!),
    enabled: !!groupId,
  })

  const [visibleCount, setVisibleCount] = useState(100)

  const updateSubscriptionInCache = (updated: Subscription) => {
    qc.setQueryData<Subscription[]>(['group-subscriptions', groupId], (current) => {
      if (!current) return current

      return current
        .filter((item) => item.enrollment.id !== updated.enrollment.id)
        .concat(updated)
    })

    qc.setQueryData<{ subscriptions?: Subscription[] }>(['group', groupId], (current) => {
      if (!current) return current

      return {
        ...current,
        subscriptions: (current.subscriptions ?? []).filter((item) => item.enrollment.id !== updated.enrollment.id).concat(updated),
      }
    })

    qc.setQueryData<{ subscriptions?: Subscription[] }>(['dashboard'], (current) => {
      if (!current) return current

      return {
        ...current,
        subscriptions: (current.subscriptions ?? []).filter((item) => item.enrollment.id !== updated.enrollment.id).concat(updated),
      }
    })
  }

  const renew = useMutation({
    mutationFn: (data: { enrollmentId: string; subscriptionId?: string; planId?: string; extraSessions?: number }) =>
      api.renewSubscription(groupId!, data),
    onSuccess: (updatedSubscription) => {
      updateSubscriptionInCache(updatedSubscription)
      qc.invalidateQueries({ queryKey: ['group', groupId] })
      qc.invalidateQueries({ queryKey: ['group-subscriptions', groupId] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setRenewFor(null)
      setPlanSelection((current) => ({ ...current, [updatedSubscription.enrollment.id]: '' }))
      setExtraSessions((current) => ({ ...current, [updatedSubscription.enrollment.id]: 0 }))
    },
    onError: (error) => {
      console.error('Renewal failed:', error)
    },
  })

  const subs = subscriptions ?? []
  const expired = subs.filter((s) => s.status === 'EXPIRED')
  const warning = subs.filter((s) => s.status === 'WARNING')
  const active = subs.filter((s) => s.status === 'ACTIVE')

  const sectionProps = {
    visibleCount,
    setVisibleCount,
    renewFor,
    setRenewFor,
    planSelection,
    setPlanSelection,
    extraSessions,
    setExtraSessions,
    plans,
    renew,
    t,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">{t('groups.subscriptionsDesc')}</p>
        <Link
          to="/subscriptions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline shrink-0"
        >
          <Package className="w-4 h-4" />
          {t('plans.manage')}
        </Link>
      </div>

      {!plans.length && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted">{t('plans.emptyAssign')}</p>
            <Link to="/subscriptions">
              <Button variant="secondary" size="sm" className="mt-3">
                <Package className="w-4 h-4" />
                {t('plans.create')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Section title={t('groups.expiredStudents')} items={expired} variant="danger" {...sectionProps} />
      <Section title={t('groups.warningStudents')} items={warning} variant="warning" {...sectionProps} />
      <Section title={t('groups.activeStudents')} items={active} variant="success" {...sectionProps} />

      {!subs.length && (
        <p className="text-center text-muted py-12">{t('groups.noSubscriptions')}</p>
      )}
    </div>
  )
}
