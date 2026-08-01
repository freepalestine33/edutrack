import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'card' | 'stat'
}

export function GlassPanel({ children, className, variant = 'default' }: GlassPanelProps) {
  const baseStyles = 'backdrop-blur-xl border border-white/10 shadow-lg'
  
  const variants = {
    default: 'bg-white/5 dark:bg-black/30',
    card: 'bg-white/10 dark:bg-black/40 rounded-2xl',
    stat: 'bg-gradient-to-br from-white/10 to-white/5 dark:from-black/40 dark:to-black/30 rounded-2xl'
  }

  return (
    <div className={cn(baseStyles, variants[variant], className)}>
      {children}
    </div>
  )
}

interface GlassButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'default' | 'primary' | 'danger'
  disabled?: boolean
}

export function GlassButton({ children, onClick, className, variant = 'default', disabled }: GlassButtonProps) {
  const baseStyles = 'backdrop-blur-md border border-white/20 shadow-md transition-all duration-200 rounded-full font-medium'
  
  const variants = {
    default: 'bg-white/10 hover:bg-white/20 text-foreground',
    primary: 'bg-accent/80 hover:bg-accent text-white border-accent/50 hover:border-accent',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 hover:border-red-500/50'
  }

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], disabledStyles, className)}
    >
      {children}
    </button>
  )
}
