import { useTranslation } from 'react-i18next'
import { LogOut, User, Sun, Globe, Building2, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PageHeader } from '@/components/PageHeader'
import { useAppStore, type Locale } from '@/store/app'
import { usePremium } from '@/lib/premium'

const locales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
]

export function SettingsPage() {
  const { t } = useTranslation()
  const { locale, setLocale, orgName, userName, email, orgType, logout } = useAppStore()
  const premium = usePremium()

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  const formatDate = (date: Date | number | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Section */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <User className="w-4 h-4" />
              </div>
              <CardTitle>{t('settings.profile')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-surface">
              <p className="text-xs text-muted">{t('onboarding.yourName')}</p>
              <p className="font-medium text-foreground mt-0.5">{userName || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface">
              <p className="text-xs text-muted">{t('onboarding.email')}</p>
              <p className="font-medium text-foreground mt-0.5">{email || '—'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Organization Section */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Building2 className="w-4 h-4" />
              </div>
              <CardTitle>{t('settings.organization')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-surface">
              <p className="text-xs text-muted">{t('onboarding.orgName')}</p>
              <p className="font-medium text-foreground mt-0.5">{orgName || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface">
              <p className="text-xs text-muted">{t('settings.orgType')}</p>
              <p className="font-medium text-foreground mt-0.5 capitalize">{orgType || 'tutor'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Sun className="w-4 h-4" />
              </div>
              <CardTitle>{t('settings.appearance')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Label>{t('settings.theme')}</Label>
            <ThemeToggle className="mt-2" />
          </CardContent>
        </Card>

        {/* Language Section */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Globe className="w-4 h-4" />
              </div>
              <CardTitle>{t('settings.language')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Label>{t('settings.language')}</Label>
            <Select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              {locales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Info */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Shield className="w-4 h-4" />
            </div>
            <CardTitle>{t('settings.subscription')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-xl bg-surface">
            <p className="text-xs text-muted">{t('settings.expiresAt')}</p>
            <p className="font-medium text-foreground mt-0.5">{formatDate(premium.expiresAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <LogOut className="w-4 h-4" />
            </div>
            <CardTitle className="text-red-500">{t('settings.dangerZone')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="danger"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('settings.logout')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
