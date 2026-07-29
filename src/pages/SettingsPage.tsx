import { useTranslation } from 'react-i18next'
import { LogOut, Settings as SettingsIcon, Sun, Globe, User, Home } from 'lucide-react'
// 'Sun' is still used for the Appearance card icon.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAppStore, type Locale } from '@/store/app'

const locales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
]

export function SettingsPage() {
  const { t } = useTranslation()
  const { locale, setLocale, orgName, userName, email, orgType, logout } = useAppStore()

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  return (
    <div className="space-y-6 max-w-xl">
      <header className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
          <p className="text-sm text-muted">{t('settings.subtitle')}</p>
        </div>
      </header>

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

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Home className="w-4 h-4" />
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

      <Card>
        <CardContent className="pt-6">
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
