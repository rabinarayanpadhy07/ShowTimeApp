import { useState } from 'react'
import { CalendarDays, Clapperboard, LayoutDashboard, LogOut, Menu, Ticket, UserRound, X } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router'

import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'
import { Button, IconButton } from '../ui/Button'
import { SearchInput } from '../ui/SearchInput'
import { Logo } from './Logo'
import { UserMenu } from './UserMenu'

const NAV_LINKS = [
  { to: '/movies', label: 'Movies', icon: Clapperboard },
  { to: '/events', label: 'Events', icon: CalendarDays },
]

function navLinkClass({ isActive }) {
  return cn(
    'inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors',
    isActive ? 'bg-surface-subtle text-ink' : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink',
  )
}

const mobileLinkClass = ({ isActive }) =>
  cn(
    'flex items-center gap-3 rounded-control px-3 py-3 text-base font-medium',
    isActive ? 'bg-surface-subtle text-ink' : 'text-ink-secondary hover:bg-surface-subtle',
  )

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { status, isAuthenticated, isAdmin, logout } = useAuth()

  const closeMenu = () => setMenuOpen(false)

  const search = (term) => {
    if (!term) return
    closeMenu()
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  const mobileLinks = [
    ...NAV_LINKS,
    ...(isAuthenticated
      ? [
          { to: '/my-bookings', label: 'My bookings', icon: Ticket },
          { to: '/profile', label: 'Profile', icon: UserRound },
        ]
      : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin dashboard', icon: LayoutDashboard }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center gap-4 lg:h-20">
        <Logo />

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <NavLink to="/my-bookings" className={navLinkClass}>
              My bookings
            </NavLink>
          )}
        </nav>

        <SearchInput
          key={location.pathname === '/search' ? location.search : 'nav'}
          className="ml-auto hidden w-full max-w-xs lg:flex"
          label="Search ShowTime"
          onSearch={search}
        />

        <div className="ml-auto hidden min-w-40 items-center justify-end gap-2 md:flex lg:ml-0">
          {isAuthenticated && <UserMenu />}
          {status === 'anonymous' && (
            <>
              <Button to="/login" variant="ghost" size="sm" state={{ from: `${location.pathname}${location.search}` }}>
                Log in
              </Button>
              <Button to="/register" size="sm">
                Sign up
              </Button>
            </>
          )}
        </div>

        <IconButton
          className="ml-auto md:hidden"
          label={menuOpen ? 'Close menu' : 'Open menu'}
          icon={menuOpen ? X : Menu}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        />
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-line bg-surface md:hidden">
          <div className="container-page space-y-4 py-4">
            <SearchInput label="Search ShowTime (mobile)" onSearch={search} />
            <nav aria-label="Mobile" className="grid gap-1">
              {mobileLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={closeMenu} className={mobileLinkClass}>
                  <Icon aria-hidden="true" size={20} />
                  {label}
                </NavLink>
              ))}
            </nav>
            {isAuthenticated ? (
              <Button
                variant="outline"
                fullWidth
                leftIcon={LogOut}
                onClick={async () => {
                  closeMenu()
                  await logout()
                  navigate('/')
                }}
              >
                Log out
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button to="/login" variant="outline" fullWidth onClick={closeMenu}>
                  Log in
                </Button>
                <Button to="/register" fullWidth onClick={closeMenu}>
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
