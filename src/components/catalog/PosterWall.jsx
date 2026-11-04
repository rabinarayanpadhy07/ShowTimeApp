import { Link } from 'react-router'

import { cn } from '../../lib/cn'

/**
 * Endless, slowly moving row of movie posters for the home hero. The track renders its list
 * twice and the animation moves it by half, so the loop is seamless. The row is decorative (the
 * same movies are listed, accessibly, further down the page), so it is hidden from assistive
 * technology and its links are not tab stops. Hovering pauses the row.
 */
export function PosterRow({ movies, reverse = false, className }) {
  if (movies.length === 0) return null
  return (
    <div
      aria-hidden="true"
      className={cn('overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]', className)}
    >
      <div className={cn('flex w-max animate-marquee-left hover:[animation-play-state:paused]', reverse && '[animation-direction:reverse]')}>
        {[...movies, ...movies].map((movie, index) => (
          <div key={`${movie.slug}-${index}`} className="w-32 pr-4 sm:w-40 lg:w-48">
            <Link
              to={`/movies/${movie.slug}`}
              tabIndex={-1}
              className="block overflow-hidden rounded-xl bg-white/5 shadow-elevated ring-1 ring-white/10 transition-transform duration-300 hover:scale-[1.04]"
            >
              <img src={movie.posterUrl} alt="" loading="lazy" decoding="async" className="aspect-[2/3] w-full object-cover" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
