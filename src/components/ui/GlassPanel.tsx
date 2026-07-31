import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'accent' | 'danger'
}

export function GlassPanel({ children, className, variant = 'default' }: GlassPanelProps) {
  const variants = {
    default: 'bg-white/5 backdrop-blur-md border border-white/10',
    accent: 'bg-accent/10 backdrop-blur-md border border-accent/20',
    danger: 'bg-red-500/10 backdrop-blur-md border border-red-500/20',
  }

  return (
    <div className={cn(
      'rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl',
      variants[variant],
      className
    )}>
      {children}
    </div>
  )
}

interface GlassButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'default' | 'accent' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function GlassButton({ children, onClick, className, variant = 'default', size = 'md' }: GlassButtonProps) {
  const variants = {
    default: 'bg-white/10 hover:bg-white/20 border-white/20',
    accent: 'bg-accent/20 hover:bg-accent/30 border-accent/30 text-accent',
    danger: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full backdrop-blur-md border transition-all duration-300 hover:scale-105 active:scale-95',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  )
}
