import { Link } from 'react-router'

import { cn } from '../../lib/cn'

export function Logo({ className }) {
  return (
    <Link to="/" className={cn('inline-flex items-center rounded-md', className)} aria-label="ShowTime home">
      <span className="text-xl font-extrabold tracking-tight text-ink">
        Show<span className="text-primary-strong">Time</span>
      </span>
    </Link>
  )
}
