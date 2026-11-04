import { Clapperboard } from 'lucide-react'

import { cn } from '../../lib/cn'

/**
 * Poster or photo for a card. Without an image it falls back to artwork drawn from the item's
 * palette. Decorative: the title is repeated in accessible text nearby.
 */
export function PosterArt({ title, palette = ['#484848', '#222222'], icon: Icon = Clapperboard, aspect = 'poster', imageUrl, className, children }) {
  const [from, to] = palette
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-card bg-ink',
        aspect === 'poster' && 'aspect-[2/3]',
        aspect === 'landscape' && 'aspect-[4/3]',
        aspect === 'wide' && 'aspect-[16/9]',
        className,
      )}
      style={{ backgroundImage: `linear-gradient(155deg, ${from} 0%, ${to} 100%)` }}
    >
      {imageUrl ? (
        // Fills the whole card at the card's own size; any overflow is trimmed evenly from the edges.
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between p-4 text-white">
          <Icon size={28} className="opacity-70" />
          <div>
            <div className="mb-2 h-0.5 w-8 bg-white/70" />
            <p className="line-clamp-3 text-lg leading-tight font-extrabold tracking-tight uppercase drop-shadow-sm sm:text-xl">{title}</p>
          </div>
        </div>
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />
      {children}
    </div>
  )
}
