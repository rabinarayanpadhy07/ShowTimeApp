import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CreditCard, Lock, ShieldCheck, TimerReset } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import {
  cancelBooking,
  confirmPayment,
  getBooking,
  getPaymentConfig,
  getPaymentStatus,
  startPayment,
} from '../api/bookingApi'
import { newIdempotencyKey } from '../api/client'
import { OrderSummary } from '../components/booking/OrderSummary'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Section'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatCountdown, formatCurrency } from '../lib/format'
import { BOOKING_STATUS } from '../lib/labels'
import { openRazorpayCheckout } from '../lib/razorpay'

function useCountdown(deadline) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!deadline) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [deadline])
  return deadline ? new Date(deadline).getTime() - now : null
}

// A delayed bank confirmation is polled for about a minute before the page stops waiting.
const POLL_INTERVAL_MS = 3000
const POLL_ATTEMPTS = 20

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Pays in Razorpay's checkout and lets the server decide the outcome: the browser only relays
 * Razorpay's signed result.
 */
function PaymentPanel({ booking, config, onPaid }) {
  const [state, setState] = useState({ phase: 'idle', error: null, declined: null })
  // Kept until the server answers, so a network retry replays the same start request.
  const attemptKey = useRef(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  if (!config.available) {
    return (
      <Alert tone="warning" title="Online payment is not available">
        Payments are not configured on this server, so bookings cannot be completed. Your seats are held until the timer
        runs out and you have not been charged.
      </Alert>
    )
  }

  const runCheckout = async (session) => {
    if (config.provider === 'razorpay') return openRazorpayCheckout(session)
    throw new Error('Online payment is not available right now. Please try again later.')
  }

  /** Applies the server's view of the attempt; polls while the provider has not confirmed yet. */
  const settle = async (paymentId, status) => {
    for (let attempt = 0; ; attempt++) {
      if (!mounted.current) return
      if (status.bookingStatus === 'CONFIRMED') return onPaid(status.booking)
      if (status.status === 'FAILED') {
        return setState({ phase: 'idle', error: null, declined: status.failureReason || 'The payment was declined.' })
      }
      if (status.bookingStatus !== 'PENDING') {
        return setState({
          phase: 'idle',
          error: new Error('This booking is no longer awaiting payment. Any amount taken will be refunded automatically.'),
          declined: null,
        })
      }
      if (attempt >= POLL_ATTEMPTS) return setState({ phase: 'waiting', error: null, declined: null })
      setState({ phase: 'confirming', error: null, declined: null })
      await delay(POLL_INTERVAL_MS)
      status = await getPaymentStatus(paymentId)
    }
  }

  const pay = async () => {
    if (!attemptKey.current) attemptKey.current = newIdempotencyKey()
    setState({ phase: 'starting', error: null, declined: null })
    try {
      const session = await startPayment(booking.reference, attemptKey.current)
      // The server reuses the open provider order for later attempts, so a fresh key is safe now.
      attemptKey.current = null
      const checkout = await runCheckout(session)
      if (checkout.status !== 'success') {
        return setState({ phase: 'idle', error: null, declined: checkout.failure })
      }
      setState({ phase: 'confirming', error: null, declined: null })
      await settle(session.paymentId, await confirmPayment(session.paymentId, checkout.result))
    } catch (error) {
      // Keep the key only if we never heard back, so a retry replays the same attempt.
      if (error.status) attemptKey.current = null
      if (mounted.current) setState({ phase: 'idle', error, declined: null })
    }
  }

  const busy = state.phase === 'starting' || state.phase === 'confirming'

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm text-ink-secondary">
        <ShieldCheck aria-hidden="true" size={16} className="shrink-0 text-ink-muted" />
        You&apos;ll pay in Razorpay&apos;s secure window (cards, UPI, netbanking, wallets). ShowTime never sees your card details.
      </p>
      {state.phase === 'confirming' && (
        <p role="status" className="text-sm text-ink-secondary">
          Confirming your payment with the provider…
        </p>
      )}
      {state.phase === 'waiting' && (
        <Alert tone="warning" title="Still waiting for your bank">
          The payment provider has not confirmed this payment yet. Your booking will be confirmed automatically as soon as it
          does, and you will not be charged twice. Check My bookings in a few minutes.
        </Alert>
      )}
      {state.declined && (
        <Alert tone="error" title="Payment not completed">
          {state.declined} Your seats are still held, so you can try again.
        </Alert>
      )}
      {state.error && (
        <Alert tone="error" title="Payment not completed">
          {state.error.message}
        </Alert>
      )}
      <Button size="lg" fullWidth leftIcon={Lock} loading={busy} disabled={state.phase === 'waiting'} onClick={pay}>
        Pay {formatCurrency(booking.total, booking.currency)}
      </Button>
    </div>
  )
}

export default function CheckoutPage() {
  useDocumentTitle('Checkout')
  const { reference } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const bookingState = useAsync(() => getBooking(reference), [reference])
  const config = useAsync(getPaymentConfig, [])
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState(null)
  const booking = bookingState.data
  const remaining = useCountdown(booking?.status === 'PENDING' ? booking.holdExpiresAt : null)

  if (bookingState.isLoading || config.isLoading) return <LoadingState label="Loading your booking…" className="py-32" />
  if (bookingState.error) {
    return bookingState.error.code === 'NOT_FOUND' ? (
      <EmptyState title="Booking not found" action={<Button to="/my-bookings">My bookings</Button>} className="py-24" />
    ) : (
      <ErrorState message={bookingState.error.message} onRetry={bookingState.reload} className="py-24" />
    )
  }

  const backTo = booking.type === 'MOVIE' ? `/movies/${booking.parentSlug}` : `/events/${booking.parentSlug}`
  const expired = booking.status === 'EXPIRED' || (booking.status === 'PENDING' && remaining !== null && remaining <= 0)

  if (booking.status === 'CONFIRMED') {
    return (
      <EmptyState
        title="This booking is already paid"
        action={<Button to={`/bookings/${booking.reference}/confirmation`}>View tickets</Button>}
        className="py-24"
      />
    )
  }

  if (booking.status !== 'PENDING' || expired) {
    return (
      <EmptyState
        icon={TimerReset}
        title={expired ? 'Your seat hold has expired' : `This booking is ${BOOKING_STATUS[booking.status]?.label.toLowerCase()}`}
        message={expired ? 'The seats were released so others can book them. You have not been charged.' : undefined}
        action={<Button to={backTo}>Choose again</Button>}
        className="py-24"
      />
    )
  }

  const cancel = async () => {
    setCancelling(true)
    setCancelError(null)
    try {
      await cancelBooking(booking.reference)
      navigate(backTo)
    } catch (error) {
      setCancelError(error)
      setCancelling(false)
    }
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <Link to={backTo} className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-ink-secondary hover:text-ink">
        <ArrowLeft aria-hidden="true" size={16} />
        Back to {booking.title}
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Checkout</h1>
        <p role="timer" aria-live="off" className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5 text-sm font-semibold text-accent-strong">
          <TimerReset aria-hidden="true" size={16} />
          Seats held for {formatCountdown(remaining)}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-ink">Tickets will be sent to</h2>
            <p className="mt-2 text-sm text-ink-secondary">
              {user.fullName} · {user.email}
            </p>
            <p className="mt-1 text-xs text-ink-muted">Booking reference {booking.reference}</p>
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
              <CreditCard aria-hidden="true" size={20} />
              Payment
            </h2>
            {config.error ? (
              <Alert tone="error">{config.error.message}</Alert>
            ) : (
              <PaymentPanel
                booking={booking}
                config={config.data}
                onPaid={(paid) => navigate(`/bookings/${paid.reference}/confirmation`, { replace: true })}
              />
            )}
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-muted">Prices, fees and availability are confirmed by ShowTime&apos;s servers.</p>
            <Button variant="ghost" onClick={cancel} loading={cancelling}>
              Cancel and release seats
            </Button>
          </div>
          {cancelError && <Alert tone="error">{cancelError.message}</Alert>}
        </div>

        <aside aria-label="Order summary" className="lg:sticky lg:top-28 lg:h-fit">
          <OrderSummary booking={booking} />
        </aside>
      </div>
    </div>
  )
}
