import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OrgType = 'tutor'
export type Locale = 'en' | 'fr' | 'ar'
export type Theme = 'light' | 'dark' | 'system'

interface AppState {
  onboarded: boolean
  orgType: OrgType | null
  orgName: string
  userName: string
  email: string
  token: string | null
  role: 'ADMIN' | 'TEACHER' | 'TUTOR' | null
  locale: Locale
  theme: Theme
  sidebarCollapsed: boolean
  session: { token: string; role: 'ADMIN' | 'TEACHER' | 'TUTOR'; orgType: OrgType; orgName: string; userName: string; email: string } | null
  isNewUser: boolean
  setOnboarding: (data: {
    orgType: OrgType
    orgName: string
    userName: string
    email: string
  }) => void
  setSession: (data: { token: string; role: 'ADMIN' | 'TEACHER' | 'TUTOR'; orgType: OrgType; orgName: string; userName: string; email: string }) => void
  setLocale: (locale: Locale) => void
  setTheme: (theme: Theme) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  completeOnboarding: () => void
  logout: () => void
  clearNewUserFlag: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboarded: false,
      orgType: null,
      orgName: '',
      userName: '',
      email: '',
      token: null,
      role: null,
      locale: 'ar',
      theme: 'system',
      sidebarCollapsed: false,
      session: null,
      isNewUser: false,
      setOnboarding: (data) => set(data),
      setSession: (data) => {
        const isAdmin = data.email?.trim().toLowerCase() === 'yacinegorine15@gmail.com'
        const role = isAdmin ? 'ADMIN' : data.role
        const session = { ...data, role }
        set({ ...data, role, onboarded: true, session })
      },
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      completeOnboarding: () => set({ onboarded: true }),
      logout: () => {
        localStorage.removeItem('edutrack-app')
        set({
          onboarded: false,
          orgType: null,
          orgName: '',
          userName: '',
          email: '',
          token: null,
          role: null,
          locale: 'ar',
          theme: 'system',
          sidebarCollapsed: false,
          session: null,
          isNewUser: false,
        })
      },
      clearNewUserFlag: () => set({ isNewUser: false }),
    }),
    { name: 'edutrack-app' },
  ),
)

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}
