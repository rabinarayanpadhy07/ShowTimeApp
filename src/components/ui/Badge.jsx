import { cn } from '../../lib/cn'

const TONES = {
  neutral: 'bg-surface-subtle text-ink-secondary border-line',
  primary: 'bg-primary-soft text-primary-strong border-primary/30',
  success: 'bg-secondary-soft text-secondary-strong border-secondary/30',
  promo: 'bg-accent-soft text-accent-strong border-accent/30',
  dark: 'bg-ink/80 text-white border-transparent backdrop-blur-sm',
  outline: 'bg-surface text-ink border-line',
}

export function Badge({ tone = 'neutral', icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {Icon && <Icon aria-hidden="true" size={12} />}
      {children}
    </span>
  )
}
