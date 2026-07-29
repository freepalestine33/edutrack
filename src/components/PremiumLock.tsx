import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock, DollarSign } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { usePremium } from '@/lib/premium'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export function PremiumLock() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const role = useAppStore((s) => s.role)
  const premium = usePremium()

  const title = premium.organization?.premiumTrialUsed
    ? t('premium.lock.trialEnded', 'Your free trial has ended')
    : t('premium.lock.expired', 'Your subscription has expired')

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted">
            {t('premium.lock.desc', 'Premium access stopped at the exact end of your period. Upgrade now to keep using all features.')}
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/upgrade')}>
              <DollarSign className="w-4 h-4 mr-2" />
              {t('premium.lock.upgrade', 'Upgrade now')}
            </Button>
            {role === 'ADMIN' && (
              <Button variant="secondary" onClick={() => navigate('/admin/requests')}>
                {t('premium.lock.review', 'Review upgrade requests')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
