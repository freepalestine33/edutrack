import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/Layout'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AttendancePage } from '@/pages/AttendancePage'
import { StudentsPage } from '@/pages/StudentsPage'
import { FinancePage } from '@/pages/FinancePage'
import { SchedulePage } from '@/pages/SchedulePage'
import { PlansPage } from '@/pages/PlansPage'
import { SubscriptionsPage } from '@/pages/SubscriptionsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AdminRequestsPage } from '@/pages/AdminRequestsPage'
import { usePremium } from '@/lib/premium'
import { GroupsListPage } from '@/pages/groups/GroupsListPage'
import { GroupLayout } from '@/pages/groups/GroupLayout'
import { GroupOverviewPage } from '@/pages/groups/GroupOverviewPage'
import { GroupSchedulePage } from '@/pages/groups/GroupSchedulePage'
import { GroupStudentsPage } from '@/pages/groups/GroupStudentsPage'
import { GroupSessionPage } from '@/pages/groups/GroupSessionPage'
import { GroupSubscriptionsPage } from '@/pages/groups/GroupSubscriptionsPage'
import { GroupHistoryPage } from '@/pages/groups/GroupHistoryPage'
import { PlansSelectionPage } from '@/pages/PlansSelectionPage'
import { useAppStore, applyTheme } from '@/store/app'
import { LoadingState } from '@/components/PageHeader'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

function LocaleSync() {
  const { i18n } = useTranslation()
  const locale = useAppStore((s) => s.locale)
  const setLocale = useAppStore((s) => s.setLocale)

  useEffect(() => {
    const active = locale === 'ar' || locale === 'fr' || locale === 'en' ? locale : 'ar'
    if (active !== locale) setLocale('ar')
    document.documentElement.dir = active === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = active
    i18n.changeLanguage(active)
  }, [locale, i18n, setLocale])

  return null
}

function ThemeSync() {
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    applyTheme(theme)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') applyTheme('system')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return null
}

function AppRoutes() {
  const onboarded = useAppStore((s) => s.onboarded)
  const token = useAppStore((s) => s.token)
  const role = useAppStore((s) => s.role)
  const isNewUser = useAppStore((s) => s.isNewUser)
  const premium = usePremium()

  if (!onboarded || !token) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/plans-selection" element={<PlansSelectionPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  // Show plans page only for new users who just signed up
  if (isNewUser) {
    return (
      <Routes>
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/plans-selection" element={<PlansSelectionPage />} />
        <Route path="*" element={<Navigate to="/plans" replace />} />
      </Routes>
    )
  }

  // Prevent redirect loops while premium status is still loading.
  if (premium.isLoading) {
    return (
      <AppLayout>
        <LoadingState />
      </AppLayout>
    )
  }

  // Close all application pages immediately the exact moment premium expires, showing the upgrade/plans page
  if (!premium.isActive) {
    return (
      <Routes>
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/plans-selection" element={<PlansSelectionPage />} />
        <Route path="/upgrade" element={<Navigate to="/plans" replace />} />
        {role === 'ADMIN' && <Route path="/panel/manage-subscriptions-x99" element={<AdminRequestsPage />} />}
        <Route path="*" element={<Navigate to="/plans" replace />} />
      </Routes>
    )
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/upgrade" element={<Navigate to="/plans" replace />} />
        <Route path="/panel/manage-subscriptions-x99" element={role === 'ADMIN' ? <AdminRequestsPage /> : <Navigate to="/" replace />} />
        <Route path="/groups" element={<GroupsListPage />} />
        <Route path="/groups/:groupId" element={<GroupLayout />}>
          <Route index element={<GroupOverviewPage />} />
          <Route path="schedule" element={<GroupSchedulePage />} />
          <Route path="students" element={<GroupStudentsPage />} />
          <Route path="session" element={<GroupSessionPage />} />
          <Route path="subscriptions" element={<GroupSubscriptionsPage />} />
          <Route path="history" element={<GroupHistoryPage />} />
        </Route>
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/plans-selection" element={<PlansSelectionPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* Legacy redirects */}
        <Route path="/classes" element={<Navigate to="/groups" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LocaleSync />
        <ThemeSync />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
