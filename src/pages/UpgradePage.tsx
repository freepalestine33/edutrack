import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  DollarSign,
  Crown,
  Zap,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { usePremium } from '@/lib/premium'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label, Select } from '@/components/ui/Input'

export function UpgradePage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const premium = usePremium()
  const { organization } = premium

  const [plan, setPlan] = useState<'100students' | '250students' | '500students' | ''>('')
  const [amount, setAmount] = useState(0)
  const [message, setMessage] = useState('')

  const trialMutation = useMutation({
    mutationFn: api.startTrial,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organization'] }),
  })
  const reqMutation = useMutation({ mutationFn: api.createSubscriptionRequest })

  const trialDisabled = trialMutation.isPending || Boolean(organization?.premiumTrialUsed) || premium.isActive

  const selectPlan = (selectedPlan: '100students' | '250students' | '500students' | '') => {
    setPlan(selectedPlan)
    setAmount(
      selectedPlan === '100students' ? 6500 : 
      selectedPlan === '250students' ? 7900 : 
      selectedPlan === '500students' ? 9500 : 0
    )
  }

  const submitRequest = async () => {
    setMessage('')
    try {
      await reqMutation.mutateAsync({ planId: plan || undefined, amount, currency: 'DZD' })
      setMessage(t('upgrade.requestSubmitted', 'تم إرسال الطلب. أصبح مرئيًا الآن في طلبات الاشتراك.'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('upgrade.requestFailed', 'تعذر إرسال طلبك.'))
    }
  }

  // ---------------------------------------------------------------------------
  // ACTIVE PREMIUM USER UI:
  // For users with an active 6m, 1yr, or trial upgrade:
  // Remove free trial & upgrade plans, and display an enhanced subscription status.
  // ---------------------------------------------------------------------------
  if (premium.isActive) {
    const expiresDate = organization?.premiumExpiresAt
      ? new Date(organization.premiumExpiresAt).toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null

    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-10">
        {/* Premium Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white shadow-xl">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/30">
                <Crown className="w-7 h-7 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {t('upgrade.activeTitle')}
                  </h1>
                  <span className="px-3.5 py-1 rounded-full bg-emerald-400/30 backdrop-blur-md border border-emerald-300/40 text-xs font-bold text-emerald-100 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                    {t('upgrade.proActive')}
                  </span>
                </div>
                <p className="mt-1 text-emerald-100/90 text-sm max-w-xl">
                  {t('upgrade.activeSubtitle')}
                </p>
              </div>
            </div>

            <a
              href={import.meta.env.VITE_TELEGRAM_LINK || 'https://t.me/ysngr33'}
              target="_blank"
              rel="noreferrer"
              className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm"
            >
              <MessageCircle className="w-4.5 h-4.5 text-cyan-200" />
              {t('upgrade.supportTelegram')}
            </a>
          </div>
        </div>

        {/* Live Countdown & Subscription Expiry Details */}
        <Card className="border border-border/80 shadow-lg bg-card/70 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-surface/30 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                {t('upgrade.timeRemaining', 'Subscription Time Remaining')}
              </CardTitle>
              {expiresDate && (
                <div className="flex items-center gap-1.5 text-xs text-muted font-medium bg-surface px-3 py-1.5 rounded-lg border border-border/50">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  <span>
                    {t('upgrade.expiresOn', 'Expires on:')} <strong className="text-foreground">{expiresDate}</strong>
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Live Animated 4-Block Countdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-surface/70 border border-border/60 shadow-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                  {premium.days}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted mt-1">
                  {t('upgrade.days')}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-surface/70 border border-border/60 shadow-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                  {String(premium.hours).padStart(2, '0')}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted mt-1">
                  {t('upgrade.hours')}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-surface/70 border border-border/60 shadow-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                  {String(premium.minutes).padStart(2, '0')}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted mt-1">
                  {t('upgrade.minutes')}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-surface/70 border border-border/60 shadow-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl md:text-4xl font-black tracking-tight text-accent animate-pulse">
                  {String(premium.seconds).padStart(2, '0')}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent/90 mt-1">
                  {t('upgrade.seconds')}
                </span>
              </div>
            </div>

            {/* Protection Notice */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                  <p className="font-semibold text-foreground">
                  {t('upgrade.realtimeTitle')}
                </p>
                <p className="text-muted mt-0.5">
                  {t('upgrade.realtimeDesc')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Included Features Grid */}
        <Card className="border border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {t('upgrade.includedFeatures', 'Included Premium Features')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                'feature.unlimitedStudents',
                'feature.attendance',
                'feature.pdf',
                'feature.notifications',
                'feature.reports',
                'feature.schedules',
                'feature.prioritySupport',
                'feature.backups',
              ].map((key, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface/50 border border-border/40">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{t(`upgrade.${key}`)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // NEW / UN-UPGRADED / EXPIRED USER UI:
  // Display the upgrade plans page like a new user with no upgrade.
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <header className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('upgrade.title', 'Upgrade to Premium')}</h1>
          <p className="text-sm text-muted">
            {t('upgrade.desc', 'Choose a subscription plan to unlock full Edutrack features.')}
          </p>
        </div>
      </header>

      {/* Alert banner if expired */}
      {premium.isExpired && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">
              {t('upgrade.expiredAlertTitle', 'Your trial/subscription has ended')}
            </p>
            <p className="mt-0.5">
              {t(
                'upgrade.expiredAlertDesc',
                'Your premium access has expired. Please select a plan below to renew your access.'
              )}
            </p>
          </div>
        </div>
      )}

      {/* Free Trial Card (Only if trial has not been used yet) */}
      {!organization?.premiumTrialUsed && (
        <Card className="border border-accent/30 shadow-md bg-accent/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-accent">
              <Zap className="w-5 h-5" />
              {t('upgrade.trial', 'Free 15-day trial')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted">
              {t('upgrade.trialDesc', 'Start a 15-day trial to try all premium features for free.')}
            </p>
            <div className="flex items-center gap-3">
              <Button onClick={() => trialMutation.mutate()} disabled={trialDisabled}>
                <Clock className="w-4 h-4 mr-2" />
                {t('upgrade.startTrial', 'Start Free Trial')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Plans Selection */}
      <Card className="border border-border/80 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            {t('upgrade.plans', 'Upgrade Plans')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 100 Students Plan */}
            <div
              onClick={() => selectPlan('100students')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                plan === '100students'
                  ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent/30'
                  : 'border-border/60 bg-surface/50 hover:border-accent/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{t('upgrade.plan.100.title')}</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface text-muted border border-border/40">
                  {t('upgrade.plan.100.tag')}
                </span>
              </div>
              <p className="text-2xl font-black text-foreground">
                {t('upgrade.plan.100.price')} <span className="text-sm font-medium text-muted">DZD</span>
              </p>
              <Button
                variant={plan === '100students' ? 'primary' : 'secondary'}
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation()
                  selectPlan('100students')
                }}
              >
                {plan === '100students' ? t('upgrade.selected') : t('upgrade.selectPlanBtn')}
              </Button>
            </div>

            {/* 250 Students Plan */}
            <div
              onClick={() => selectPlan('250students')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                plan === '250students'
                  ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent/30'
                  : 'border-border/60 bg-surface/50 hover:border-accent/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{t('upgrade.plan.250.title')}</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface text-muted border border-border/40">
                  {t('upgrade.plan.250.tag')}
                </span>
              </div>
              <p className="text-2xl font-black text-foreground">
                {t('upgrade.plan.250.price')} <span className="text-sm font-medium text-muted">DZD</span>
              </p>
              <Button
                variant={plan === '250students' ? 'primary' : 'secondary'}
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation()
                  selectPlan('250students')
                }}
              >
                {plan === '250students' ? t('upgrade.selected') : t('upgrade.selectPlanBtn')}
              </Button>
            </div>

            {/* 500 Students Plan */}
            <div
              onClick={() => selectPlan('500students')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                plan === '500students'
                  ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent/30'
                  : 'border-border/60 bg-surface/50 hover:border-accent/50'
              }`}
            >
              <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-accent text-white text-xs font-bold shadow-sm">
                {t('upgrade.max', 'الأقصى')}
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{t('upgrade.plan.500.title')}</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface text-muted border border-border/40">
                  {t('upgrade.plan.500.tag')}
                </span>
              </div>
              <p className="text-2xl font-black text-foreground">
                {t('upgrade.plan.500.price')} <span className="text-sm font-medium text-muted">DZD</span>
              </p>
              <Button
                variant={plan === '500students' ? 'primary' : 'secondary'}
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation()
                  selectPlan('500students')
                }}
              >
                {plan === '500students' ? t('upgrade.selected') : t('upgrade.selectPlanBtn')}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 space-y-4">
            <div>
              <Label>{t('upgrade.selectedPlan', 'Selected Plan')}</Label>
              <Select
                value={plan}
                onChange={(event) => selectPlan(event.target.value as '100students' | '250students' | '500students' | '')}
                className="mt-1.5"
              >
                <option value="">{t('upgrade.selectPlan')}</option>
                <option value="100students">{`${t('upgrade.plan.100.title')} — ${t('upgrade.plan.100.price')} DZD`}</option>
                <option value="250students">{`${t('upgrade.plan.250.title')} — ${t('upgrade.plan.250.price')} DZD`}</option>
                <option value="500students">{`${t('upgrade.plan.500.title')} — ${t('upgrade.plan.500.price')} DZD`}</option>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={import.meta.env.VITE_TELEGRAM_LINK || 'https://t.me/ysngr33'}
                target="_blank"
                rel="noreferrer"
                className="flex-1"
              >
                <Button variant="secondary" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2 text-cyan-500" />
                  {t('upgrade.contactTelegram')}
                </Button>
              </a>

              <Button
                className="flex-1"
                onClick={submitRequest}
                disabled={!plan || reqMutation.isPending}
              >
                {reqMutation.isPending ? t('upgrade.submitting') : t('upgrade.request')}
              </Button>
            </div>

            {message && (
              <p className="text-sm font-medium text-accent p-3 rounded-xl bg-accent/10 border border-accent/20">
                {message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UpgradePage
