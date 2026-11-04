import { CircleCheck, Info, TriangleAlert } from 'lucide-react'

import { cn } from '../../lib/cn'

const TONES = {
  info: { classes: 'bg-surface-subtle border-line text-ink-secondary', icon: Info, iconClass: 'text-ink' },
  success: { classes: 'bg-secondary-soft border-secondary/30 text-ink-secondary', icon: CircleCheck, iconClass: 'text-secondary-strong' },
  warning: { classes: 'bg-accent-soft border-accent/30 text-ink-secondary', icon: TriangleAlert, iconClass: 'text-accent-strong' },
  error: { classes: 'bg-danger-soft border-danger/30 text-ink-secondary', icon: TriangleAlert, iconClass: 'text-danger' },
}

export function Alert({ tone = 'info', title, children, className, role }) {
  const { classes, icon: Icon, iconClass } = TONES[tone]
  return (
    <div role={role ?? (tone === 'error' ? 'alert' : 'status')} className={cn('flex gap-3 rounded-card border p-4 text-sm', classes, className)}>
      <Icon aria-hidden="true" size={20} className={cn('mt-px shrink-0', iconClass)} />
      <div className="space-y-1">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  )
}
