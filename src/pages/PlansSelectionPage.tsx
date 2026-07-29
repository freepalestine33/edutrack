import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Zap, Calendar, Crown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/app'
import { api } from '@/lib/api'

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

export function PlansSelectionPage() {
  const navigate = useNavigate()
  const { session, clearNewUserFlag } = useAppStore()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

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
      setError(err instanceof Error ? err.message : 'Failed to select plan')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background mesh-bg p-6 relative">
      <div className="w-full max-w-6xl animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted text-lg">
            Start with a free trial or upgrade to unlock full potential
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
                    {plan.price === 0 ? 'Free' : `${plan.price} ${plan.currency}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted text-sm ml-2">
                      / year
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
                  {loading === plan.id ? 'Processing...' : plan.price === 0 ? 'Start Free Trial' : 'Select Plan'}
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
