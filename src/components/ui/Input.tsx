import { cn } from '@/lib/utils'

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent',
        'transition-all duration-200 hover:border-border/80',
        className,
      )}
      {...props}
    />
  )
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-sm font-medium text-foreground mb-1.5 block', className)}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent',
        'transition-all duration-200 hover:border-border/80',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
