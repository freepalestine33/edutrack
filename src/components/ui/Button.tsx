import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
        'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
        {
          'bg-gradient-to-b from-accent to-accent-hover text-white hover:from-accent-hover hover:to-accent-hover focus:ring-accent shadow-sm hover:shadow-md':
            variant === 'primary',
          'bg-card text-foreground border border-border hover:bg-surface hover:border-border focus:ring-border':
            variant === 'secondary',
          'bg-transparent text-accent hover:bg-accent-muted focus:ring-accent':
            variant === 'ghost',
          'bg-danger text-white hover:opacity-90 focus:ring-danger hover:shadow-md': variant === 'danger',
          'h-10 px-4 text-sm gap-1.5 sm:h-8 sm:px-3': size === 'sm',
          'h-12 px-5 text-sm gap-2 sm:h-10 sm:px-4': size === 'md',
          'h-14 px-6 text-base gap-2 sm:h-12 sm:px-6': size === 'lg',
        },
        className,
      )}
      {...props}
    />
  )
}
