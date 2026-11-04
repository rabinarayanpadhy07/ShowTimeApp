import { cn } from '../../lib/cn'

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-line/60', className)} />
}

export function MovieCardSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-[2/3] w-full rounded-card" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  )
}

export function EventCardSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-[4/3] w-full rounded-card" />
      <Skeleton className="mt-3 h-4 w-2/3" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <Skeleton className="mt-2 h-3 w-1/3" />
    </div>
  )
}

/** Grid of card skeletons announced once to assistive technology. */
export function CardGridSkeleton({ count = 8, variant = 'movie', className }) {
  const Card = variant === 'event' ? EventCardSkeleton : MovieCardSkeleton
  return (
    <div role="status" className={className}>
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} />
      ))}
    </div>
  )
}
