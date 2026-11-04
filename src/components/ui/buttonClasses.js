import { cn } from '../../lib/cn'

const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-hover',
  success: 'bg-secondary text-on-secondary hover:bg-secondary-hover',
  dark: 'bg-ink text-white hover:bg-ink-secondary',
  danger: 'bg-danger text-white hover:bg-danger/90',
  outline: 'border border-ink/20 bg-surface text-ink hover:border-ink hover:bg-surface-subtle',
  ghost: 'bg-transparent text-ink hover:bg-surface-subtle',
  link: 'bg-transparent px-0 text-ink underline underline-offset-4 hover:text-primary-strong',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export function buttonClasses({ variant = 'primary', size = 'md', fullWidth = false, className } = {}) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-control font-semibold whitespace-nowrap transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
    VARIANTS[variant],
    variant !== 'link' && SIZES[size],
    fullWidth && 'w-full',
    className,
  )
}
