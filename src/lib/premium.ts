import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type Organization } from './api'

export interface PremiumState {
  organization?: Organization
  /** True when a premium period (trial or paid) has ever been started. */
  started: boolean
  /** True when the organization has any premium period set (trial or paid). */
  hasPremium: boolean
  /** True only while the exact expiry moment is still in the future. */
  isActive: boolean
  /** True when a period was started but has now ended. */
  isExpired: boolean
  /** Exact expiry timestamp in ms (epoch), or null when no period exists. */
  expiresAt: number | null
  /** Milliseconds remaining (>= 0). Updates every second. */
  millisRemaining: number
  /** Human readable countdown, e.g. "14d 23h 59m 58s". */
  countdown: string
  days: number
  hours: number
  minutes: number
  seconds: number
}

function compute(now: number, org?: Organization): PremiumState {
  const expiresAt = org?.premiumExpiresAt ? new Date(org.premiumExpiresAt).getTime() : null
  const started = expiresAt !== null
  const hasPremium = started
  const isActive = expiresAt !== null && expiresAt > now
  const isExpired = started && !isActive
  const millisRemaining = expiresAt !== null ? Math.max(0, expiresAt - now) : 0

  const totalSeconds = Math.floor(millisRemaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  const countdown = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`

  return {
    organization: org,
    started,
    hasPremium,
    isActive,
    isExpired,
    expiresAt,
    millisRemaining,
    countdown,
    days,
    hours,
    minutes,
    seconds,
  }
}

/**
 * Centralised premium/trial state. The countdown ticks every second so the
 * subscription ends at the exact stored moment (down to the second).
 */
export function usePremium(): PremiumState {
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: () => api.getOrganization(),
  })
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return compute(now, organization)
}
