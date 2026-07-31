import { useTranslation } from 'react-i18next'
import { LogOut, User, Sun, Globe, Building2, Shield } from 'lucide-react'
import { Label, Select } from '@/components/ui/Input'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PageHeader } from '@/components/PageHeader'
import { GlassPanel, GlassButton } from '@/components/ui/GlassPanel'
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
        <GlassPanel className="p-6 hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('settings.profile')}</h3>
          </div>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-surface">
              <p className="text-xs text-muted">{t('onboarding.yourName')}</p>
              <p className="font-medium text-foreground mt-0.5">{userName || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface">
              <p className="text-xs text-muted">{t('onboarding.email')}</p>
              <p className="font-medium text-foreground mt-0.5">{email || '—'}</p>
            </div>
          </div>
        </GlassPanel>

        {/* Organization Section */}
        <GlassPanel className="p-6 hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('settings.organization')}</h3>
          </div>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-surface">
              <p className="text-xs text-muted">{t('onboarding.orgName')}</p>
              <p className="font-medium text-foreground mt-0.5">{orgName || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface">
              <p className="text-xs text-muted">{t('settings.orgType')}</p>
              <p className="font-medium text-foreground mt-0.5 capitalize">{orgType || 'tutor'}</p>
            </div>
          </div>
        </GlassPanel>

        {/* Appearance Section */}
        <GlassPanel className="p-6 hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white">
              <Sun className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('settings.appearance')}</h3>
          </div>
          <div>
            <Label>{t('settings.theme')}</Label>
            <ThemeToggle className="mt-2" />
          </div>
        </GlassPanel>

        {/* Language Section */}
        <GlassPanel className="p-6 hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('settings.language')}</h3>
          </div>
          <div>
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
          </div>
        </GlassPanel>
      </div>

      {/* Subscription Info */}
      <GlassPanel variant="accent" className="p-6 hover:scale-[1.02] transition-transform">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{t('settings.subscription')}</h3>
        </div>
        <div className="p-3 rounded-xl bg-surface">
          <p className="text-xs text-muted">{t('settings.expiresAt')}</p>
          <p className="font-medium text-foreground mt-0.5">{formatDate(premium.expiresAt)}</p>
        </div>
      </GlassPanel>

      {/* Danger Zone */}
      <GlassPanel variant="danger" className="p-6 hover:scale-[1.02] transition-transform">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
            <LogOut className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-red-500">{t('settings.dangerZone')}</h3>
        </div>
        <GlassButton variant="danger" onClick={handleLogout} className="w-full">
          <LogOut className="w-4 h-4 mr-2" />
          {t('settings.logout')}
        </GlassButton>
      </GlassPanel>
    </div>
  )
}
