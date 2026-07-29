import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Package, Clock, Banknote } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { PageHeader, LoadingState, EmptyState } from '@/components/PageHeader'
import { formatCurrency } from '@/lib/utils'

const defaultForm: {
  name: string
  sessionsCount: number
  price: number
  attendancePolicy: 'PAID_ABSENCE' | 'FLEXIBLE'
} = {
  name: '',
  sessionsCount: 8,
  price: 1500,
  attendancePolicy: 'PAID_ABSENCE',
}

export function SubscriptionsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [planForm, setPlanForm] = useState(defaultForm)

  const { data: subscriptions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: api.getSubscriptions,
  })

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: api.getSubscriptionPlans,
  })

  const createPlan = useMutation({
    mutationFn: api.createSubscriptionPlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] })
      setShowPlanForm(false)
      setPlanForm(defaultForm)
    },
  })

  if (loadingSubs || loadingPlans) return <LoadingState />

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('subscriptions.title')}
        description={t('subscriptions.subtitle')}
        action={
          <Button onClick={() => setShowPlanForm(!showPlanForm)}>
            <Plus className="w-4 h-4" />
            {t('plans.create')}
          </Button>
        }
      />

      <section>
        <h2 className="text-lg font-medium text-foreground mb-4">{t('subscriptions.plans')}</h2>

        {showPlanForm && (
          <Card className="mb-4 animate-fade-in">
            <CardContent className="pt-6">
              <h3 className="font-medium text-foreground mb-4">{t('plans.newPlan')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>{t('subscriptions.planName')}</Label>
                  <Input
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder={t('plans.namePlaceholder')}
                  />
                </div>
                <div>
                  <Label>{t('subscriptions.sessions')}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={planForm.sessionsCount}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, sessionsCount: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>{t('subscriptions.price')} (DZD)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>{t('subscriptions.policy')}</Label>
                  <Select
                    value={planForm.attendancePolicy}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        attendancePolicy: e.target.value as 'PAID_ABSENCE' | 'FLEXIBLE',
                      })
                    }
                  >
                    <option value="PAID_ABSENCE">{t('subscriptions.paidAbsence')}</option>
                    <option value="FLEXIBLE">{t('subscriptions.flexible')}</option>
                  </Select>
                  <p className="text-xs text-muted mt-2">
                    {planForm.attendancePolicy === 'PAID_ABSENCE'
                      ? t('plans.paidAbsenceDesc')
                      : t('plans.flexibleDesc')}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  disabled={!planForm.name || !planForm.sessionsCount || createPlan.isPending}
                  onClick={() => createPlan.mutate(planForm)}
                >
                  {t('plans.create')}
                </Button>
                <Button variant="secondary" onClick={() => setShowPlanForm(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {plans.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="hover:card-shadow-lg transition-shadow duration-200">
                <CardContent className="py-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{plan.name}</p>
                      <p className="text-lg font-semibold text-accent mt-1">
                        {plan.price ? formatCurrency(plan.price, plan.currency) : '0 DZD'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/40">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                      <Clock className="w-3.5 h-3.5" />
                      {plan.sessionsCount} {t('plans.sessionsLabel')}
                    </span>
                    {plan.sessionsCount > 0 && plan.price > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                        <Banknote className="w-3.5 h-3.5" />
                        {formatCurrency(plan.price / plan.sessionsCount, plan.currency)} /{' '}
                        {t('plans.session')}
                      </span>
                    )}
                  </div>
                  <span className="inline-block text-xs px-2.5 py-1 rounded-lg bg-surface text-muted mt-3 font-medium">
                    {plan.attendancePolicy === 'PAID_ABSENCE'
                      ? t('subscriptions.paidAbsence')
                      : t('subscriptions.flexible')}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          !showPlanForm && <EmptyState message={t('plans.empty')} />
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-foreground mb-4">{t('subscriptions.active')}</h2>
        {subscriptions.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {sub.enrollment.student.firstName} {sub.enrollment.student.lastName}
                      </p>
                      <p className="text-xs text-muted">
                        {sub.plan?.name || 'Unknown Plan'} ·{' '}
                        {t('subscriptions.sessionsUsed', {
                          used: sub.sessionsUsed,
                          remaining: sub.sessionsRemaining,
                        })}
                      </p>
                      {sub.expiresAt && (
                        <p className="text-xs text-muted mt-1">
                          Expires: {new Date(sub.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState message={t('subscriptions.emptyActive')} />
        )}
      </section>
    </div>
  )
}
