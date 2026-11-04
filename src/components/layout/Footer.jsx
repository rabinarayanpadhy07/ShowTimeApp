import { Link } from 'react-router'

import { BackendStatus } from '../system/BackendStatus'
import { Logo } from './Logo'

const CURRENT_YEAR = new Date().getFullYear()

const COLUMNS = [
  {
    title: 'Discover',
    links: [
      { to: '/movies', label: 'Movies now showing' },
      { to: '/movies?status=COMING_SOON', label: 'Coming soon' },
      { to: '/events', label: 'Live events' },
      { to: '/search', label: 'Search' },
    ],
  },
  {
    title: 'Events by category',
    links: [
      { to: '/events?category=CONCERT', label: 'Concerts' },
      { to: '/events?category=FESTIVAL', label: 'Festivals' },
      { to: '/events?category=SPORTS', label: 'Sports' },
      { to: '/events?category=COMEDY', label: 'Comedy' },
    ],
  },
  {
    title: 'Your account',
    links: [
      { to: '/login', label: 'Log in' },
      { to: '/register', label: 'Create an account' },
      { to: '/my-bookings', label: 'My bookings' },
      { to: '/profile', label: 'Profile' },
    ],
  },
  {
    title: 'For partners',
    links: [{ to: '/admin', label: 'Admin dashboard' }],
  },
]

/** Phones get one short row of links instead of the four columns. */
const COMPACT_LINKS = [
  { to: '/movies', label: 'Movies' },
  { to: '/events', label: 'Events' },
  { to: '/search', label: 'Search' },
  { to: '/my-bookings', label: 'My bookings' },
  { to: '/profile', label: 'Profile' },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface-subtle">
      <div className="container-page py-6 md:py-12">
        <div className="flex flex-col gap-4 md:hidden">
          <Logo />
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {COMPACT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-ink-secondary underline-offset-4 hover:text-ink hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="hidden gap-10 md:grid md:grid-cols-[1.2fr_repeat(4,1fr)]">
          <div className="max-w-xs space-y-3">
            <Logo />
            <p className="text-sm text-ink-secondary">Movies, concerts, festivals and sports: find something great to do tonight.</p>
          </div>
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold text-ink">{column.title}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-ink-secondary underline-offset-4 hover:text-ink hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-4 text-xs text-ink-muted md:mt-10 md:pt-6 md:text-sm">
          <p>© {CURRENT_YEAR} ShowTime</p>
          <BackendStatus />
        </div>
      </div>
    </footer>
  )
}
