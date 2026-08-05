import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { LogOut, Settings as SettingsIcon, Sun, Globe, User, Home, CreditCard, Wallet, ArrowUpRight } from 'lucide-react'
// 'Sun' is still used for the Appearance card icon.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { api } from '@/lib/api'
import { useAppStore, type Locale } from '@/store/app'
import { formatCurrency } from '@/lib/utils'

const locales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
]

export function SettingsPage() {
  const { t } = useTranslation()
  const { locale, setLocale, orgName, userName, email, orgType, logout } = useAppStore()
  const { data: finance } = useQuery({ queryKey: ['finance'], queryFn: api.getFinance })

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-lg shadow-accent/20">
              <SettingsIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t('settings.title')}</h1>
              <p className="mt-1 text-sm text-muted max-w-2xl">{t('settings.subtitle')}</p>
            </div>
          </div>
          <Link to="/upgrade">
            <Button variant="ghost" className="self-start md:self-center">{t('settings.upgrade')}</Button>
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                    <User className="w-5 h-5" />
                  </div>
                  <CardTitle>{t('settings.profile')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
                  <p className="text-xs text-muted">{t('onboarding.yourName')}</p>
                  <p className="mt-1 font-semibold text-foreground">{userName || '—'}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
                  <p className="text-xs text-muted">{t('onboarding.email')}</p>
                  <p className="mt-1 font-semibold text-foreground">{email || '—'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                    <Sun className="w-5 h-5" />
                  </div>
                  <CardTitle>{t('settings.appearance')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label>{t('settings.theme')}</Label>
                <ThemeToggle className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                    <Globe className="w-5 h-5" />
                  </div>
                  <CardTitle>{t('settings.language')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Label>{t('settings.language')}</Label>
                <Select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
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
                  <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                    <Home className="w-5 h-5" />
                  </div>
                  <CardTitle>{t('settings.organization')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
                  <p className="text-xs text-muted">{t('onboarding.orgName')}</p>
                  <p className="mt-1 font-semibold text-foreground">{orgName || '—'}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
                  <p className="text-xs text-muted">{t('settings.orgType')}</p>
                  <p className="mt-1 font-semibold text-foreground capitalize">{orgType || 'tutor'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                  <CreditCard className="w-5 h-5" />
                </div>
                <CardTitle>{t('settings.manageSubscriptions')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/subscriptions">
                <Button variant="secondary" className="w-full justify-between">
                  <span>{t('settings.subscriptions')}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/finance">
                <Button variant="secondary" className="w-full justify-between">
                  <span>{t('settings.finance')}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/plans">
                <Button variant="secondary" className="w-full justify-between">
                  <span>{t('settings.upgrade')}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/students">
                <Button variant="secondary" className="w-full justify-between">
                  <span>{t('nav.students')}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                  <Wallet className="w-5 h-5" />
                </div>
                <CardTitle>{t('finance.title')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted">{t('finance.revenue')}</p>
              <div className="rounded-3xl bg-surface p-4 border border-border/60">
                <p className="text-sm text-muted">{t('finance.profit')}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{formatCurrency(finance?.profit ?? 0)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-accent/5 to-surface border border-accent/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <CardTitle>{t('settings.upgrade')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">
                {t('upgrade.desc')}
              </p>
              <Link to="/plans">
                <Button className="mt-4 w-full">{t('settings.upgrade')}</Button>
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card className="border border-border/70 bg-surface/90">
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
