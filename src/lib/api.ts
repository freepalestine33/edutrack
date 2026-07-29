const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim()
const BASE = configuredBase
  ? `${configuredBase.replace(/\/+$/, '')}/api`
  : '/api'

/** Structured API error with status code and parsed message. */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function authHeaders() {
  try {
    const saved = JSON.parse(localStorage.getItem('edutrack-app') || '{}')
    const token = saved?.state?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch { return {} }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  headers.set('Content-Type', 'application/json')
  const token = authHeaders().Authorization
  if (token) headers.set('Authorization', token)
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (res.status === 401 && !path.includes('/auth/login')) {
    try {
      localStorage.removeItem('edutrack-app')
      if (window.location.pathname !== '/onboarding') {
        window.location.href = '/onboarding'
      }
    } catch {}
  }
  if (!res.ok) {
    // Safe text parsing — handles non-JSON responses (e.g. nginx 404 HTML)
    let message = 'Request failed'
    try {
      const text = await res.text()
      const json = JSON.parse(text)
      message = json.error || json.message || text
    } catch {
      message = `Server error (${res.status})`
    }
    throw new ApiError(res.status, message)
  }
  return res.json()
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  login: (data: { email: string; password: string }) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<{ user: AuthUser }>('/auth/me'),
  getOrganization: (token?: string) => request<Organization>('/organization', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }),
  createOrganization: (data: CreateOrgPayload) =>
    request<AuthResponse>('/organization', { method: 'POST', body: JSON.stringify(data) }),
  activateTrial: (data: { duration: number; durationUnit: string }) =>
    request<any>('/account/start-trial', { method: 'POST', body: JSON.stringify(data) }),
  getDashboard: () => request<DashboardData>('/dashboard'),
  getStudents: () => request<Student[]>('/students'),
  createStudent: (data: CreateStudentPayload) =>
    request<Student>('/students', { method: 'POST', body: JSON.stringify(data) }),

  getGroups: () => request<Group[]>('/classes'),
  // Legacy alias expected by some pages
  getClasses: () => request<Group[]>('/classes'),
  getTodaySessions: () => request<SessionItem[]>('/today-sessions'),
  getGroup: (id: string) => request<GroupDetail>(`/classes/${id}`),
  createGroup: (data: CreateGroupPayload) =>
    request<Group>('/classes', { method: 'POST', body: JSON.stringify(data) }),
  deleteGroup: (id: string) =>
    request<{ success: boolean; deletedId: string }>(`/classes/${id}`, { method: 'DELETE' }),
  addGroupSchedule: (groupId: string, data: CreateSchedulePayload) =>
    request<ScheduleItem>(`/classes/${groupId}/schedules`, { method: 'POST', body: JSON.stringify(data) }),
  deleteSchedule: (id: string) => request<{ ok: boolean }>(`/schedules/${id}`, { method: 'DELETE' }),
  addGroupStudent: (groupId: string, data: CreateGroupStudentPayload) =>
    request<GroupEnrollment>(`/classes/${groupId}/students`, { method: 'POST', body: JSON.stringify(data) }),
  getGroupSubscriptions: (groupId: string) =>
    request<Subscription[]>(`/classes/${groupId}/subscriptions`),
  getGroupSession: (groupId: string) => request<SessionItem | null>(`/classes/${groupId}/session`),
  startGroupSession: (groupId: string) =>
    request<SessionItem>(`/classes/${groupId}/session/start`, { method: 'POST' }),
  endGroupSession: (groupId: string) =>
    request<SessionItem>(`/classes/${groupId}/session/end`, { method: 'POST' }),
  renewSubscription: (
    groupId: string,
    data: { enrollmentId: string; subscriptionId?: string; planId: string },
  ) => request<Subscription>(`/classes/${groupId}/subscriptions`, { method: 'POST', body: JSON.stringify(data) }),

  getTeachers: () => request<User[]>('/teachers'),
  getGroupHistory: (groupId: string) => request<SessionItem[]>(`/classes/${groupId}/history`),
  getSubscriptionPlans: () => request<SubscriptionPlan[]>('/subscription-plans'),
  getSubscriptions: () => request<Subscription[]>('/subscriptions'),
  createSubscriptionRequest: (data: { planId?: string; amount: number; currency?: string }) =>
    request<any>('/subscription-requests', { method: 'POST', body: JSON.stringify(data) }),
  getSubscriptionRequests: () => request<any[]>('/subscription-requests'),
  startTrial: () => request<any>('/account/start-trial', { method: 'POST' }),
  approveSubscriptionRequest: (id: string) => request<any>(`/subscription-requests/${id}/approve`, { method: 'POST' }),
  rejectSubscriptionRequest: (id: string, reason?: string) => request<any>(`/subscription-requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  createSubscriptionPlan: (data: CreatePlanPayload) =>
    request<SubscriptionPlan>('/subscription-plans', { method: 'POST', body: JSON.stringify(data) }),
  markAttendance: (data: AttendancePayload) =>
    request<{ attendance: Attendance; subscription: Subscription | null }>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getFinance: () => request<FinanceData>('/finance'),
  createPayment: (data: CreatePaymentPayload) =>
    request<Payment>('/payments', { method: 'POST', body: JSON.stringify(data) }),
  createExpense: (data: CreateExpensePayload) =>
    request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  getAllSchedules: () => request<ScheduleItem[]>('/schedules'),
}

export interface Organization {
  id: string
  name: string
  type: 'TUTOR'
  locale: string
  currency: string
  premiumExpiresAt?: string | null
  premiumTrialUsed?: boolean
  premiumActive?: boolean
  users?: User[]
  subjects?: Subject[]
}

export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface AuthUser {
  id: string
  orgId: string
  email: string
  name: string
  role: 'ADMIN' | 'TEACHER' | 'TUTOR'
}

export interface AuthResponse { user: AuthUser; token: string; org?: Organization }

export interface Student {
  id: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
  enrollments?: GroupEnrollment[]
}

export interface GroupEnrollment {
  id: string
  student: Student
  subscriptions?: Subscription[]
  class?: Group
}

export interface Group {
  id: string
  name: string
  subject?: Subject
  teacher?: User
  schedules?: ScheduleItem[]
  sessions?: SessionItem[]
  _count?: { enrollments: number }
}

export interface GroupDetail extends Group {
  enrollments: GroupEnrollment[]
  subscriptions: Subscription[]
}

export interface Subject {
  id: string
  name: string
  code?: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  sessionsCount: number
  price: number
  currency: string
  attendancePolicy: 'PAID_ABSENCE' | 'FLEXIBLE'
}

export interface Subscription {
  id: string
  sessionsTotal: number
  sessionsUsed: number
  sessionsRemaining: number
  status: 'ACTIVE' | 'WARNING' | 'EXPIRED'
  plan: SubscriptionPlan
  enrollment: GroupEnrollment & { student: Student; class?: Group }
  expiresAt?: string | null
}

export interface SessionItem {
  id: string
  scheduledAt: string
  status: string
  class: Group & { enrollments?: GroupEnrollment[] }
  attendances: Attendance[]
}

export interface Attendance {
  id: string
  sessionId: string
  studentId: string
  status: 'PRESENT' | 'ABSENT'
  countedTowardSubscription: boolean
  isDropIn: boolean
  isUnpaid: boolean
}

export interface ScheduleItem {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  notes?: string | null
  class?: Group
  teacher?: User
}

export interface Payment {
  id: string
  amount: number
  currency: string
  method: string
  type: string
  receiptUrl?: string
  paidAt: string
  student: Student
}

export interface Expense {
  id: string
  category: string
  amount: number
  description?: string
  recurring: boolean
  expenseDate: string
}

export interface DashboardData {
  stats: {
    students: number
    active: number
    warning: number
    expired: number
    revenue: number
    expenses: number
    profit: number
  } | null
  groups: Group[]
  subscriptions: Subscription[]
}

export interface FinanceData {
  payments: Payment[]
  expenses: Expense[]
  totalRevenue: number
  totalExpenses: number
  profit: number
}

export interface CreateOrgPayload {
  name: string
  type: 'tutor'
  userName: string
  email: string
  password: string
  phone?: string
}

export interface CreateStudentPayload {
  firstName: string
  lastName: string
  phone?: string
  email?: string
}

export interface CreateGroupPayload {
  name: string
  subjectId?: string
  maxCapacity?: number
  level?: string
  year?: string
  section?: string
}

export interface CreateSchedulePayload {
  dayOfWeek: number
  startTime: string
  endTime: string
  notes?: string
  teacherId?: string
}

export interface CreateGroupStudentPayload {
  firstName: string
  lastName: string
  phone?: string
  email?: string
  planId?: string
}

export interface CreatePlanPayload {
  name: string
  sessionsCount: number
  price: number
  attendancePolicy: 'PAID_ABSENCE' | 'FLEXIBLE'
}

export interface CreatePaymentPayload {
  studentId: string
  subscriptionId?: string
  planId?: string
  amount: number
  currency?: string
  method?: string
  type?: string
}

export interface CreateExpensePayload {
  category: string
  amount: number
  description?: string
  recurring?: boolean
}

export interface AttendancePayload {
  sessionId: string
  studentId: string
  status: 'PRESENT' | 'ABSENT'
  subscriptionId?: string
  isDropIn?: boolean
}

// Legacy aliases
export type ClassItem = Group
