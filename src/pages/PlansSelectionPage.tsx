import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Zap, Calendar, Crown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/app'
import { api } from '@/lib/api'

const PLANS = [
  {
    id: 'trial',
    name: 'تجربة مجانية',
    description: 'جرّب كل المميزات مجانًا',
    duration: 15,
    durationUnit: 'days',
    price: 0,
    currency: 'DZD',
    features: ['وصول كامل لكل المميزات', 'مدة تجربة 15 يومًا', 'لا تحتاج بطاقة ائتمان', 'إلغاء في أي وقت'],
    icon: Zap,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: '100students',
    name: 'حتى 100 طالب',
    description: 'مثالية للمجموعات الصغيرة',
    duration: 1,
    durationUnit: 'year',
    price: 6500,
    currency: 'DZD',
    features: ['وصول كامل لكل المميزات', 'صلاحية سنة واحدة', 'دعم ذات أولوية', 'نسخ احتياطي للبيانات'],
    icon: Calendar,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: '250students',
    name: 'حتى 250 طالبًا',
    description: 'مناسبة للمجموعات المتوسطة',
    duration: 1,
    durationUnit: 'year',
    price: 7900,
    currency: 'DZD',
    features: ['وصول كامل لكل المميزات', 'صلاحية سنة واحدة', 'دعم ذات أولوية', 'نسخ احتياطي للبيانات', 'تحليلات متقدمة'],
    icon: Crown,
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: '500students',
    name: 'حتى 500 طالب',
    description: 'مثالية للمجموعات الكبيرة',
    duration: 1,
    durationUnit: 'year',
    price: 9500,
    currency: 'DZD',
    features: ['وصول كامل لكل المميزات', 'صلاحية سنة واحدة', 'دعم ذات أولوية', 'نسخ احتياطي للبيانات', 'تحليلات متقدمة', 'مدير مخصص'],
    icon: Crown,
    color: 'from-emerald-500 to-teal-500'
  }
]

export function PlansSelectionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session, clearNewUserFlag } = useAppStore()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSelectPlan = async (planId: string) => {
    const token = session?.token || useAppStore.getState().token
    if (!token) {
      setError(t('plansSelection.loginRequired', 'يرجى تسجيل الدخول لاختيار باقة'))
      navigate('/onboarding')
      return
    }

    setLoading(planId)
    setError('')

    try {
      const plan = PLANS.find(p => p.id === planId)
      if (!plan) return

      if (planId === 'trial') {
        // Activate trial
        await api.activateTrial({
          duration: plan.duration,
          durationUnit: plan.durationUnit
        })
        clearNewUserFlag()
        navigate('/')
      } else {
        // Create subscription request for paid plans
        await api.createSubscriptionRequest({
          planId: planId,
          amount: plan.price,
          currency: plan.currency
        })
        clearNewUserFlag()
        // Redirect to upgrade page to complete payment
        navigate('/upgrade')
        return
      }

      navigate('/')
    } catch (err) {
      console.error('Plan selection error:', err)
      setError(err instanceof Error ? err.message : t('plansSelection.selectFailed', 'فشل اختيار الباقة'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background mesh-bg p-6 relative">
      <div className="w-full max-w-6xl animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-4">
            {t('plansSelection.title', 'اختر باقتك')}
          </h1>
          <p className="text-muted text-lg">
            {t('plansSelection.subtitle', 'ابدأ بتجربة مجانية أو اختر باقة للترقية')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className="bg-card rounded-2xl border border-border p-8 card-shadow-lg flex flex-col hover:border-accent transition-all duration-300 hover:scale-105"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-muted mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? t('plansSelection.free', 'مجاني') : `${plan.price} ${plan.currency}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted text-sm ml-2">
                      / {t('plansSelection.year', 'سنة')}
                    </span>
                  )}
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
                  disabled={loading !== null}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {loading === plan.id ? t('plansSelection.processing', 'جاري المعالجة...') : plan.price === 0 ? t('plansSelection.startTrial', 'ابدأ التجربة المجانية') : t('plansSelection.selectPlan', 'اختر الباقة')}
                </Button>
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mt-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
