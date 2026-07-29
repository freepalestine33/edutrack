import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Check,
  Zap,
  Calendar,
  Crown,
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  DollarSign,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

import { useAppStore } from '@/store/app'
import { api } from '@/lib/api'
import { usePremium } from '@/lib/premium'

const PLANS = [
  {
    id: 'trial',
    name: 'Free Trial',
    description: 'Try all features for free',
    duration: 15,
    durationUnit: 'days',
    price: 0,
    currency: 'DZD',
    features: ['Full access to all features', '15 days trial period', 'No credit card required', 'Cancel anytime'],
    icon: Zap,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: '100students',
    name: 'Up to 100 Students',
    description: 'Perfect for small groups',
    duration: 1,
    durationUnit: 'year',
    price: 6500,
    currency: 'DZD',
    features: ['Full access to all features', '1 year validity', 'Priority support', 'Data backup'],
    icon: Calendar,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: '250students',
    name: 'Up to 250 Students',
    description: 'Perfect for medium groups',
    duration: 1,
    durationUnit: 'year',
    price: 7900,
    currency: 'DZD',
    features: ['Full access to all features', '1 year validity', 'Priority support', 'Data backup', 'Advanced analytics'],
    icon: Crown,
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: '500students',
    name: 'Up to 500 Students',
    description: 'Perfect for large groups',
    duration: 1,
    durationUnit: 'year',
    price: 9500,
    currency: 'DZD',
    features: ['Full access to all features', '1 year validity', 'Priority support', 'Data backup', 'Advanced analytics', 'Dedicated manager'],
    icon: Crown,
    color: 'from-emerald-500 to-teal-500'
  }
]

export function PlansPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { session, clearNewUserFlag, isNewUser } = useAppStore()
  const premium = usePremium()
  const { organization } = premium

  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<'100students' | '250students' | '500students' | ''>('')
  const [message, setMessage] = useState('')

  const trialMutation = useMutation({
    mutationFn: api.startTrial,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organization'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      clearNewUserFlag()
      navigate('/')
    },
  })

  const reqMutation = useMutation({
    mutationFn: api.createSubscriptionRequest,
    onSuccess: () => {
      setMessage('Request submitted. It is now visible in Subscription Requests.')
      clearNewUserFlag()
      if (!isNewUser) {
        navigate('/')
      }
    },
  })

  const trialDisabled = trialMutation.isPending || Boolean(organization?.premiumTrialUsed) || premium.isActive

  const handleSelectPlan = async (planId: string) => {
    const token = session?.token || useAppStore.getState().token
    if (!token) {
      setError('Please sign in to select a plan')
      navigate('/onboarding')
      return
    }

    setLoading(planId)
    setError('')

    try {
      const plan = PLANS.find(p => p.id === planId)
      if (!plan) return

      if (planId === 'trial') {
        await trialMutation.mutateAsync()
      } else {
        setSelectedPlan(planId as '100students' | '250students' | '500students')
        setLoading(null)
      }
    } catch (err) {
      console.error('Plan selection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to select plan')
      setLoading(null)
    }
  }

  const submitRequest = async () => {
    setMessage('')
    setError('')
    try {
      const plan = PLANS.find(p => p.id === selectedPlan)
      if (!plan) return

      await reqMutation.mutateAsync({ 
        planId: selectedPlan, 
        amount: plan.price, 
        currency: plan.currency 
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to submit your request.')
    }
  }

  // ---------------------------------------------------------------------------
  // ACTIVE PREMIUM USER UI
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
      <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-fade-in">
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
                    {t('plans.activeTitle', 'Active Premium Subscription')}
                  </h1>
                  <span className="px-3.5 py-1 rounded-full bg-emerald-400/30 backdrop-blur-md border border-emerald-300/40 text-xs font-bold text-emerald-100 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                    PRO ACTIVE
                  </span>
                </div>
                <p className="mt-1 text-emerald-100/90 text-sm max-w-xl">
                  {t(
                    'plans.activeSubtitle',
                    'Your organization has full unlimited access to all features. All study groups, attendance, and finance features are active.'
                  )}
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
              {t('plans.supportTelegram', 'Support Telegram')}
            </a>
          </div>
        </div>

        {/* Live Countdown & Subscription Expiry Details */}
        <Card className="border border-border/80 shadow-lg bg-card/70 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-surface/30 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                {t('plans.timeRemaining', 'Subscription Time Remaining')}
              </CardTitle>
              {expiresDate && (
                <div className="flex items-center gap-1.5 text-xs text-muted font-medium bg-surface px-3 py-1.5 rounded-lg border border-border/50">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  <span>
                    {t('plans.expiresOn', 'Expires on:')} <strong className="text-foreground">{expiresDate}</strong>
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
                  {t('plans.days', 'Days')}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-surface/70 border border-border/60 shadow-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                  {String(premium.hours).padStart(2, '0')}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted mt-1">
                  {t('plans.hours', 'Hours')}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-surface/70 border border-border/60 shadow-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                  {String(premium.minutes).padStart(2, '0')}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted mt-1">
                  {t('plans.minutes', 'Minutes')}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-surface/70 border border-border/60 shadow-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl md:text-4xl font-black tracking-tight text-accent animate-pulse">
                  {String(premium.seconds).padStart(2, '0')}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent/90 mt-1">
                  {t('plans.seconds', 'Seconds')}
                </span>
              </div>
            </div>

            {/* Protection Notice */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">
                  {t('plans.realtimeTitle', 'Real-Time Expiry Protection')}
                </p>
                <p className="text-muted mt-0.5">
                  {t(
                    'plans.realtimeDesc',
                    'Your subscription runs down to the exact second stored in the system. When your access expires, your data remains 100% safe and secure.'
                  )}
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
              {t('plans.includedFeatures', 'Included Premium Features')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                'Unlimited Students & Study Groups',
                'Automated Attendance & Session Tracking',
                'Digital PDF Receipts & Exports',
                'WhatsApp & Email Receipt Notifications',
                'Full Financial Revenue & Expense Reports',
                'Weekly Schedules & Multi-Teacher Support',
                'Priority Telegram Customer Support',
                'Cloud Backups & Instant Updates',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface/50 border border-border/40">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // NEW / UN-UPGRADED / EXPIRED USER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background mesh-bg p-6 relative">
      <div className="w-full max-w-6xl animate-fade-in">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              {isNewUser ? t('plans.choosePlan', 'Choose Your Plan') : t('plans.upgradeTitle', 'Upgrade to Premium')}
            </h1>
          </div>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            {isNewUser 
              ? t('plans.choosePlanDesc', 'Start with a free trial or upgrade to unlock full potential')
              : t('plans.upgradeDesc', 'Choose a subscription plan to unlock full Edutrack features.')
            }
          </p>
        </div>

        {/* Alert banner if expired */}
        {premium.isExpired && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-600 dark:text-amber-400 max-w-4xl mx-auto">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">
                {t('plans.expiredAlertTitle', 'Your trial/subscription has ended')}
              </p>
              <p className="mt-0.5">
                {t(
                  'plans.expiredAlertDesc',
                  'Your premium access has expired. Please select a plan below to renew your access.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Free Trial Card (Only if trial has not been used yet) */}
        {!organization?.premiumTrialUsed && (
          <div className="max-w-4xl mx-auto mb-8">
            <Card className="border border-accent/30 shadow-md bg-accent/5">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-accent">
                  <Zap className="w-5 h-5" />
                  {t('plans.trial', 'Free 15-day trial')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted">
                  {t('plans.trialDesc', 'Start a 15-day trial to try all premium features for free.')}
                </p>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => handleSelectPlan('trial')} 
                    disabled={trialDisabled}
                    size="lg"
                  >
                    {trialMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting…
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        {t('plans.startTrial', 'Start Free Trial')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paid Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.filter(p => p.id !== 'trial').map((plan) => {
            const Icon = plan.icon
            const isSelected = selectedPlan === plan.id
            return (
              <div
                key={plan.id}
                className={`bg-card rounded-2xl border p-8 card-shadow-lg flex flex-col transition-all duration-300 hover:scale-105 cursor-pointer ${
                  isSelected 
                    ? 'border-accent ring-2 ring-accent/30' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setSelectedPlan(plan.id as '100students' | '250students' | '500students')}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-muted mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {plan.price} {plan.currency}
                  </span>
                  <span className="text-muted text-sm ml-2">
                    / year
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  size="lg"
                  variant={isSelected ? 'primary' : 'secondary'}
                  disabled={loading !== null}
                >
                  {isSelected ? t('plans.selected', 'Selected') : t('plans.selectPlan', 'Select Plan')}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Request Submission Section */}
        {selectedPlan && (
          <Card className="max-w-2xl mx-auto mt-8 border border-border/80 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                {t('plans.completeRequest', 'Complete Your Request')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-surface border border-border/40">
                <p className="text-sm text-muted mb-2">{t('plans.selectedPlan', 'Selected Plan')}</p>
                <p className="font-semibold text-foreground">
                  {PLANS.find(p => p.id === selectedPlan)?.name} — {PLANS.find(p => p.id === selectedPlan)?.price} DZD
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={import.meta.env.VITE_TELEGRAM_LINK || 'https://t.me/ysngr33'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1"
                >
                  <Button variant="secondary" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2 text-cyan-500" />
                    {t('plans.contactTelegram', 'Contact on Telegram')}
                  </Button>
                </a>

                <Button
                  className="flex-1"
                  onClick={submitRequest}
                  disabled={reqMutation.isPending}
                >
                  {reqMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('plans.submitting', 'Submitting…')}
                    </>
                  ) : (
                    t('plans.request', 'Request Upgrade')
                  )}
                </Button>
              </div>

              {message && (
                <p className="text-sm font-medium text-accent p-3 rounded-xl bg-accent/10 border border-accent/20">
                  {message}
                </p>
              )}

              {error && (
                <p className="text-sm font-medium text-red-600 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {error && !selectedPlan && (
          <div className="mt-6 text-center max-w-4xl mx-auto">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlansPage
