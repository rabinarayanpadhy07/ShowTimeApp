import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import { cn } from '../../lib/cn'

export function SectionHeader({ title, subtitle, actionLabel, actionTo, as: Heading = 'h2', id, className }) {
  return (
    <div data-reveal className={cn('mb-5 flex items-end justify-between gap-4', className)}>
      <div>
        <Heading id={id} className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {title}
        </Heading>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actionTo && (
        <Link
          to={actionTo}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-md text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          {actionLabel}
          <ChevronRight aria-hidden="true" size={16} />
        </Link>
      )}
    </div>
  )
}

export function PageHeader({ title, subtitle, children, className }) {
  return (
    <div className={cn('border-b border-line bg-surface', className)}>
      <div className="container-page py-8 sm:py-10">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-base text-ink-secondary">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  )
}

export function Card({ className, children, as: Element = 'div', ...props }) {
  return (
    <Element className={cn('rounded-card border border-line bg-surface p-6 shadow-card', className)} {...props}>
      {children}
    </Element>
  )
}
