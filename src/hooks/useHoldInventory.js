import { useCallback, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { createBooking } from '../api/bookingApi'
import { newIdempotencyKey } from '../api/client'
import { useAuth } from '../context/AuthContext'

/**
 * Turns a selection ({ movieShowId | eventScheduleId, seatIds | quantity }) into a server-side
 * hold and opens checkout. Retrying the same selection reuses its Idempotency-Key, so a
 * network failure followed by a retry can never create two bookings.
 */
export function useHoldInventory() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const keys = useRef(new Map())
  const [state, setState] = useState({ submitting: false, error: null })

  const hold = useCallback(
    async (selection, { onConflict } = {}) => {
      if (!isAuthenticated) {
        navigate('/login', { state: { from: `${location.pathname}${location.search}`, reason: 'booking' } })
        return
      }
      const fingerprint = JSON.stringify(selection)
      if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, newIdempotencyKey())
      setState({ submitting: true, error: null })
      try {
        const booking = await createBooking(selection, keys.current.get(fingerprint))
        navigate(`/checkout/${booking.reference}`)
      } catch (error) {
        // A definite answer from the server means the key must not be reused for a new attempt.
        if (error.status) keys.current.delete(fingerprint)
        setState({ submitting: false, error })
        if (error.code === 'CONFLICT') onConflict?.()
      }
    },
    [isAuthenticated, navigate, location.pathname, location.search],
  )

  return { hold, submitting: state.submitting, error: state.error, clearError: () => setState((s) => ({ ...s, error: null })) }
}
