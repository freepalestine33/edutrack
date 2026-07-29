import { Moon, Sun, Monitor, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore, type Theme, resolveTheme } from '@/store/app'
import { cn } from '@/lib/utils'

const themes: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: 'light', icon: Sun, labelKey: 'settings.themeLight' },
  { value: 'dark', icon: Moon, labelKey: 'settings.themeDark' },
  { value: 'system', icon: Monitor, labelKey: 'settings.themeSystem' },
]

interface ThemeToggleProps {
  className?: string
}

/**
 * Theme switcher for the Settings page only.
 * Dark mode is intentionally not surfaced anywhere else in the app —
 * keeping it in one place avoids the scattered-toggles problem.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useTranslation()
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const resolvedTheme = resolveTheme(theme)

  return (
    <div
      role="radiogroup"
      aria-label={t('settings.theme')}
      className={cn('grid grid-cols-3 gap-2', className)}
    >
      {themes.map(({ value, icon: Icon, labelKey }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              'group relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
              active
                ? 'border-accent bg-accent-muted text-accent card-shadow-lg'
                : 'border-border bg-card text-muted hover:border-accent/40 hover:text-foreground',
            )}
          >
            <Icon className={cn('w-5 h-5 transition-transform duration-500', active && theme === 'dark' && 'rotate-[20deg]')} />
            <span className="text-xs font-medium">{t(labelKey)}</span>
            {active && (
              <>
                <span className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white">
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                </span>
                {value === 'system' && (
                  <span className="text-[10px] font-medium text-accent/70 mt-0.5">
                    {t(resolvedTheme === 'dark' ? 'settings.themeDark' : 'settings.themeLight')}
                  </span>
                )}
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
