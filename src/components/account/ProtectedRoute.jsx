import { ShieldAlert } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { EmptyState, LoadingState } from '../ui/States'

/**
 * Requires a signed-in user (and optionally a role) for nested routes. This only controls
 * navigation; the backend enforces the same rules on every request.
 */
export function ProtectedRoute({ role }) {
  const { status, user, sessionExpired } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState label="Checking your session…" className="py-32" />

  if (status !== 'authenticated') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}`, reason: sessionExpired ? 'expired' : 'required' }}
      />
    )
  }

  if (role && user.role !== role) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You don't have access to this page"
        message="This area is for ShowTime administrators."
        action={<Button to="/">Back to home</Button>}
        className="py-24"
      />
    )
  }

  return <Outlet />
}
