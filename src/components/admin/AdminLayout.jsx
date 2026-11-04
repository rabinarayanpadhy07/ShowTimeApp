import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Clapperboard,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  ScrollText,
  Theater,
  Ticket,
  Users,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, ScrollRestoration, useNavigate } from 'react-router'

import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'
import { IconButton } from '../ui/Button'
import { Logo } from '../layout/Logo'

const SECTIONS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/movies', label: 'Movies', icon: Clapperboard },
  { to: '/admin/events', label: 'Events', icon: Theater },
  { to: '/admin/schedules', label: 'Schedules', icon: CalendarClock },
  { to: '/admin/venues', label: 'Venues & seats', icon: Building2 },
  { to: '/admin/bookings', label: 'Bookings', icon: Ticket },
  { to: '/admin/payments', label: 'Payments & refunds', icon: CreditCard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText },
  { to: '/admin/check-in', label: 'Ticket check-in', icon: ScanLine },
]

/**
 * Full-screen admin shell, without the customer site's header and footer: a fixed sidebar on
 * large screens and a slide-in drawer (opened from a slim top bar) on phones and tablets.
 */
export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (event) => event.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const signOut = async () => {
    closeMenu()
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-surface-subtle lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6 lg:hidden">
        <IconButton
          label="Open admin menu"
          icon={Menu}
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
          onClick={() => setMenuOpen(true)}
        />
        <Logo />
        <span className="rounded-full bg-ink px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-white uppercase">Admin</span>
      </header>

      {menuOpen && <div aria-hidden="true" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={closeMenu} />}

      <aside
        id="admin-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface transition-transform duration-200',
          'lg:visible lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-auto lg:max-w-none lg:translate-x-0',
          menuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-line px-5">
          <Logo />
          <span className="rounded-full bg-ink px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-white uppercase">Admin</span>
          <IconButton label="Close admin menu" icon={X} className="ml-auto lg:hidden" onClick={closeMenu} />
        </div>

        <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {SECTIONS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-ink text-white' : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink',
                    )
                  }
                >
                  <Icon aria-hidden="true" size={18} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="shrink-0 space-y-1 border-t border-line p-3">
          {user && (
            <div className="px-3 pt-1 pb-2">
              <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
          )}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-subtle hover:text-ink"
          >
            <ArrowLeft aria-hidden="true" size={18} />
            Back to site
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-sm font-medium text-ink-secondary hover:bg-surface-subtle hover:text-ink"
          >
            <LogOut aria-hidden="true" size={18} />
            Log out
          </button>
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="min-w-0 focus:outline-none">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
      <ScrollRestoration />
    </div>
  )
}
