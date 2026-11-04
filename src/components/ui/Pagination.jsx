import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '../../lib/cn'
import { pageItems } from '../../lib/pagination'

export function Pagination({ page, totalPages, onPageChange, className }) {
  if (totalPages <= 1) return null
  const navButton =
    'inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-ink hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-40'

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1', className)}>
      <button type="button" className={navButton} onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft aria-hidden="true" size={18} />
        <span className="hidden sm:inline">Previous</span>
        <span className="sr-only sm:hidden">Previous page</span>
      </button>
      <ul className="flex items-center gap-1">
        {pageItems(page, totalPages).map((item) =>
          typeof item === 'string' ? (
            <li key={item} aria-hidden="true" className="px-1 text-ink-muted">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
                className={cn(
                  'inline-flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  item === page ? 'bg-ink text-white' : 'text-ink hover:bg-surface-subtle',
                )}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>
      <button type="button" className={navButton} onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        <span className="hidden sm:inline">Next</span>
        <span className="sr-only sm:hidden">Next page</span>
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </nav>
  )
}
