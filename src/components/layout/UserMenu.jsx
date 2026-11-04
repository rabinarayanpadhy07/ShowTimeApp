import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LayoutDashboard, LogOut, Ticket, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { useAuth } from '../../context/AuthContext'

/** Account menu for signed-in users. The Admin link only appears for admins (the API enforces it). */
export function UserMenu() {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'mousedown' && ref.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const signOut = async () => {
    setOpen(false)
    await logout()
    navigate('/')
  }

  const item = 'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-surface-subtle'
  const initials = user.fullName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line py-1 pr-3 pl-1 text-sm font-medium text-ink hover:shadow-card"
      >
        <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden max-w-32 truncate lg:inline">{user.fullName}</span>
        <ChevronDown aria-hidden="true" size={16} />
        <span className="sr-only">Account menu</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 rounded-card border border-line bg-surface p-2 shadow-elevated">
          <div className="border-b border-line px-3 pt-1 pb-2">
            <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
          <div className="pt-2">
            <Link role="menuitem" to="/my-bookings" className={item} onClick={() => setOpen(false)}>
              <Ticket aria-hidden="true" size={16} /> My bookings
            </Link>
            <Link role="menuitem" to="/profile" className={item} onClick={() => setOpen(false)}>
              <UserRound aria-hidden="true" size={16} /> Profile
            </Link>
            {isAdmin && (
              <Link role="menuitem" to="/admin" className={item} onClick={() => setOpen(false)}>
                <LayoutDashboard aria-hidden="true" size={16} /> Admin dashboard
              </Link>
            )}
            <button role="menuitem" type="button" className={item} onClick={signOut}>
              <LogOut aria-hidden="true" size={16} /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
