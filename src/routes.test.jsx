import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as adminApi from './api/adminApi'
import * as authApi from './api/authApi'
import * as bookingApi from './api/bookingApi'
import * as catalogApi from './api/catalogApi'
import { ApiError } from './api/client'
import { getHealth } from './api/healthApi'
import { notifySessionExpired } from './api/session'
import { openRazorpayCheckout } from './lib/razorpay'
import * as f from './test/fixtures'
import { renderRoute } from './test/renderRoute'

vi.mock('./api/healthApi', () => ({ getHealth: vi.fn() }))
vi.mock('./api/catalogApi')
vi.mock('./api/bookingApi')
vi.mock('./api/authApi')
vi.mock('./api/adminApi')
vi.mock('./lib/razorpay', () => ({ openRazorpayCheckout: vi.fn() }))

const signedOut = () => vi.mocked(authApi.refresh).mockRejectedValue(new ApiError('expired', { status: 401, code: 'UNAUTHENTICATED' }))
const signedIn = (overrides) => vi.mocked(authApi.refresh).mockResolvedValue(f.session(overrides))

beforeEach(() => {
  vi.mocked(getHealth).mockResolvedValue({ status: 'UP', database: { status: 'UP', latencyMs: 1 } })
  signedOut()
  vi.mocked(authApi.getAuthConfig).mockResolvedValue({ googleClientId: null })
  vi.mocked(catalogApi.listMovies).mockResolvedValue(f.page([f.movie]))
  vi.mocked(catalogApi.listEvents).mockResolvedValue(f.page([f.event]))
  vi.mocked(catalogApi.listEventCategories).mockResolvedValue([{ value: 'CONCERT', label: 'Concerts', upcomingEvents: 1 }])
  vi.mocked(catalogApi.listVenues).mockResolvedValue([f.venue])
  vi.mocked(catalogApi.listGenres).mockResolvedValue([{ slug: 'action', name: 'Action' }])
  vi.mocked(catalogApi.listMovieLanguages).mockResolvedValue(['Hindi', 'English'])
  vi.mocked(catalogApi.listCities).mockResolvedValue(['Mumbai'])
  vi.mocked(bookingApi.getPaymentConfig).mockResolvedValue(f.razorpayConfig)
})

describe('catalog pages', () => {
  it('renders the home page from the API inside the shared layout', async () => {
    renderRoute('/')
    expect(screen.getByRole('heading', { level: 1, name: /book movies and live events/i })).toBeInTheDocument()
    expect((await screen.findAllByRole('heading', { name: 'Monsoon Express' })).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Upcoming events' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Neon Nights Live' })).toBeInTheDocument()
    expect(await screen.findByText('API online')).toBeInTheDocument()
  })

  it('sends filters, sorting and 0-based pages to the movies API', async () => {
    vi.mocked(catalogApi.listMovies).mockResolvedValue(f.page([f.movie], { page: 1, totalElements: 30 }))
    renderRoute('/movies?genre=action&language=Hindi&sort=RATING_DESC&page=2')

    expect(await screen.findByText('30 movies')).toBeInTheDocument()
    expect(catalogApi.listMovies).toHaveBeenCalledWith(
      expect.objectContaining({ genre: 'action', language: 'Hindi', sort: 'RATING_DESC', page: 1, size: 12, status: 'NOW_SHOWING' }),
    )
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows an empty state when no movie matches', async () => {
    vi.mocked(catalogApi.listMovies).mockResolvedValue(f.page([]))
    renderRoute('/movies?q=zzzz')
    expect(await screen.findByRole('heading', { name: 'No movies match your filters' })).toBeInTheDocument()
  })

  it('shows an error state with retry when the API fails', async () => {
    vi.mocked(catalogApi.listEvents).mockRejectedValue(new ApiError('Unable to reach ShowTime.', { code: 'NETWORK' }))
    renderRoute('/events?city=Mumbai&price=0-500')
    expect(await screen.findByText('Unable to reach ShowTime.')).toBeInTheDocument()
    expect(catalogApi.listEvents).toHaveBeenCalledWith(expect.objectContaining({ city: 'Mumbai', minPrice: '0', maxPrice: '500' }))
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('shows not found for an unknown movie', async () => {
    vi.mocked(catalogApi.getMovie).mockRejectedValue(new ApiError('nope', { status: 404, code: 'NOT_FOUND' }))
    renderRoute('/movies/unknown-film')
    expect(await screen.findByRole('heading', { name: 'Movie not found' })).toBeInTheDocument()
  })

  it('loads showtimes for a movie by date', async () => {
    vi.mocked(catalogApi.getMovie).mockResolvedValue(f.movieDetail)
    vi.mocked(catalogApi.getMovieShowtimes).mockResolvedValue([
      {
        venue: f.venue,
        showtimes: [{ id: 1013, startsAt: '2030-01-15T13:30:00Z', formatLabel: '2D', screenName: 'Audi 1', basePrice: 280 }],
      },
    ])
    renderRoute('/movies/monsoon-express')
    const link = await screen.findByRole('link', { name: /7:00\s?pm/i })
    expect(link).toHaveAttribute('href', '/shows/1013/seats')
    expect(catalogApi.getMovieShowtimes).toHaveBeenCalledWith('monsoon-express', expect.objectContaining({ date: expect.any(String) }))
  })

  it('shows the 404 page for unknown routes', () => {
    renderRoute('/no-such-page')
    expect(screen.getByRole('heading', { name: /left the building/i })).toBeInTheDocument()
  })
})

describe('authentication and protected routes', () => {
  it('redirects anonymous users from protected pages to login', async () => {
    renderRoute('/my-bookings')
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByText('Please sign in to continue.')).toBeInTheDocument()
  })

  it('logs in and returns to the page that required it', async () => {
    vi.mocked(authApi.login).mockResolvedValue(f.session())
    vi.mocked(bookingApi.listMyBookings).mockResolvedValue(f.page([]))
    const user = userEvent.setup()
    renderRoute('/my-bookings')

    await user.type(await screen.findByLabelText(/email/i), 'asha@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('heading', { name: 'No bookings yet' })).toBeInTheDocument()
    expect(authApi.login).toHaveBeenCalledWith({ email: 'asha@example.com', password: 'secret123' })
  })

  it('shows a useful message when sign-in is throttled', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new ApiError('Too many', { status: 429, code: 'RATE_LIMITED', retryAfter: 600 }))
    const user = userEvent.setup()
    renderRoute('/login')
    await user.type(await screen.findByLabelText(/email/i), 'asha@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'wrong-pass1')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText(/please wait 10 minutes/i)).toBeInTheDocument()
  })

  it('validates the login form before calling the API', async () => {
    const user = userEvent.setup()
    renderRoute('/login')
    await user.click(await screen.findByRole('button', { name: 'Log in' }))
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('keeps regular users out of the admin area and hides the admin link', async () => {
    signedIn()
    const { router } = renderRoute('/admin')
    expect(await screen.findByRole('heading', { name: "You don't have access to this page" })).toBeInTheDocument()
    await act(() => router.navigate('/'))
    await userEvent.click(await screen.findByRole('button', { name: /account menu/i }))
    expect(screen.queryByRole('menuitem', { name: /admin dashboard/i })).not.toBeInTheDocument()
    expect(adminApi.getOverview).not.toHaveBeenCalled()
  })

  it('shows the admin dashboard and link to admins', async () => {
    signedIn({ role: 'ADMIN' })
    vi.mocked(adminApi.getOverview).mockResolvedValue({
      moviesNowShowing: 6,
      moviesComingSoon: 2,
      showsNext7Days: 133,
      upcomingEventSchedules: 9,
      venues: 7,
      screens: 7,
      users: 3,
      bookingsByStatus: { PENDING: 1, CONFIRMED: 2, CANCELLED: 0, EXPIRED: 0, REFUNDED: 0 },
      confirmedRevenue: 1250,
      currency: 'INR',
    })
    // Sales metrics stay loading; the admin test suite covers them.
    vi.mocked(adminApi.getMetrics).mockReturnValue(new Promise(() => {}))
    const { router } = renderRoute('/admin')
    expect(await screen.findByText('133')).toBeInTheDocument()
    // The admin area has its own layout: no customer header or footer.
    expect(screen.getByRole('navigation', { name: 'Admin sections' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    await act(() => router.navigate('/'))
    await userEvent.click(await screen.findByRole('button', { name: /account menu/i }))
    expect(screen.getByRole('menuitem', { name: /admin dashboard/i })).toBeInTheDocument()
  })

  it('sends users to login with a message when the session expires', async () => {
    signedIn()
    vi.mocked(bookingApi.listMyBookings).mockResolvedValue(f.page([]))
    renderRoute('/my-bookings')
    expect(await screen.findByRole('heading', { name: 'No bookings yet' })).toBeInTheDocument()

    act(() => notifySessionExpired())

    expect(await screen.findByText('Your session has expired. Please sign in again.')).toBeInTheDocument()
  })
})

describe('booking flow', () => {
  it('prices the selection on the server and asks anonymous users to sign in before holding', async () => {
    vi.mocked(bookingApi.getShowInventory).mockResolvedValue(f.inventory)
    vi.mocked(bookingApi.quote).mockResolvedValue({ total: 305, fees: 25, currency: 'INR', lines: [], unavailableSeatIds: [] })
    const user = userEvent.setup()
    renderRoute('/shows/1013/seats')

    expect(await screen.findByRole('button', { name: /Seat A2.*unavailable/ })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Seat A3.*available/ }))
    expect(await screen.findByText('₹305')).toBeInTheDocument()
    expect(bookingApi.quote).toHaveBeenCalledWith({ movieShowId: 1013, seatIds: [13] })

    await user.click(screen.getByRole('button', { name: 'Hold seats' }))
    expect(await screen.findByText('Sign in to hold seats and complete your booking.')).toBeInTheDocument()
    expect(bookingApi.createBooking).not.toHaveBeenCalled()
  })

  it('holds seats with an idempotency key and opens checkout', async () => {
    signedIn()
    vi.mocked(bookingApi.getShowInventory).mockResolvedValue(f.inventory)
    vi.mocked(bookingApi.quote).mockResolvedValue({ total: 305, fees: 25, currency: 'INR', lines: [], unavailableSeatIds: [] })
    vi.mocked(bookingApi.createBooking).mockResolvedValue(f.booking())
    vi.mocked(bookingApi.getBooking).mockResolvedValue(f.booking())
    const user = userEvent.setup()
    renderRoute('/shows/1013/seats')

    await user.click(await screen.findByRole('button', { name: /Seat A1.*available/ }))
    await user.click(screen.getByRole('button', { name: 'Hold seats' }))

    expect(await screen.findByRole('heading', { name: 'Checkout' })).toBeInTheDocument()
    const [selection, key] = vi.mocked(bookingApi.createBooking).mock.calls[0]
    expect(selection).toEqual({ movieShowId: 1013, seatIds: [11] })
    expect(key).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
  })

  it('checkout pays through the provider checkout and confirms only after the server verifies it', async () => {
    signedIn()
    const confirmed = f.booking({ status: 'CONFIRMED', tickets: [{ code: 'TICKET1234567890', seatLabel: 'A1', status: 'VALID' }] })
    vi.mocked(bookingApi.getBooking).mockResolvedValueOnce(f.booking()).mockResolvedValueOnce(confirmed)
    vi.mocked(bookingApi.startPayment).mockResolvedValue(f.paymentSession())
    vi.mocked(openRazorpayCheckout).mockResolvedValue({
      status: 'success',
      result: { providerOrderId: 'order_rzp_1', providerPaymentId: 'pay_rzp_1', signature: 'abc123' },
    })
    vi.mocked(bookingApi.confirmPayment).mockResolvedValue({
      paymentId: 41,
      status: 'SUCCEEDED',
      bookingStatus: 'CONFIRMED',
      bookingReference: 'STABCD2345',
      booking: confirmed,
    })
    vi.mocked(bookingApi.getTickets).mockResolvedValue([
      { code: 'TICKET1234567890', seatLabel: 'A1', status: 'VALID', qrPayload: 'STKT1.TICKET1234567890.SIG', qrSvg: '<svg/>' },
    ])
    const user = userEvent.setup()
    renderRoute('/checkout/STABCD2345')

    const summary = await screen.findByRole('complementary', { name: 'Order summary' })
    expect(within(summary).getByText('₹305')).toBeInTheDocument()
    expect(screen.queryByText(/test mode/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pay ₹305' }))

    expect(await screen.findByRole('heading', { name: /all set/i })).toBeInTheDocument()
    expect(screen.getByText('TICKET1234567890')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: 'QR code for ticket TICKET1234567890' })).toBeInTheDocument()
    const [reference, key] = vi.mocked(bookingApi.startPayment).mock.calls[0]
    expect(reference).toBe('STABCD2345')
    expect(key).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
    expect(openRazorpayCheckout).toHaveBeenCalledWith(expect.objectContaining({ paymentId: 41 }))
    expect(bookingApi.confirmPayment).toHaveBeenCalledWith(41, {
      providerOrderId: 'order_rzp_1',
      providerPaymentId: 'pay_rzp_1',
      signature: 'abc123',
    })
  })

  it('a declined payment keeps the hold and allows a retry', async () => {
    signedIn()
    vi.mocked(bookingApi.getBooking).mockResolvedValue(f.booking())
    vi.mocked(bookingApi.startPayment).mockResolvedValue(f.paymentSession())
    vi.mocked(openRazorpayCheckout).mockResolvedValue({ status: 'dismissed', failure: 'The card was declined.' })
    const user = userEvent.setup()
    renderRoute('/checkout/STABCD2345')

    await user.click(await screen.findByRole('button', { name: 'Pay ₹305' }))
    expect(await screen.findByText(/The card was declined/)).toBeInTheDocument()
    expect(bookingApi.confirmPayment).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Pay ₹305' })).toBeEnabled()
  })

  it('reports a payment the server could not verify', async () => {
    signedIn()
    vi.mocked(bookingApi.getBooking).mockResolvedValue(f.booking())
    vi.mocked(bookingApi.startPayment).mockResolvedValue(f.paymentSession())
    vi.mocked(openRazorpayCheckout).mockResolvedValue({
      status: 'success',
      result: { providerOrderId: 'order_rzp_1', providerPaymentId: 'pay_rzp_3', signature: 'abc123' },
    })
    vi.mocked(bookingApi.confirmPayment).mockRejectedValue(
      new ApiError('Payment verification failed.', { status: 400, code: 'BAD_REQUEST' }),
    )
    const user = userEvent.setup()
    renderRoute('/checkout/STABCD2345')

    await user.click(await screen.findByRole('button', { name: 'Pay ₹305' }))
    expect(await screen.findByText('Payment verification failed.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /all set/i })).not.toBeInTheDocument()
  })

  it('shows the refund the policy allows before cancelling a paid booking', async () => {
    signedIn()
    const paid = f.booking({ status: 'CONFIRMED', cancellable: true })
    vi.mocked(bookingApi.listMyBookings).mockResolvedValue(f.page([paid]))
    vi.mocked(bookingApi.getCancellationPreview).mockResolvedValue({
      allowed: true,
      refundAmount: 140,
      currency: 'INR',
      message: '50% refund of the ticket price (less than 24 hours before the show).',
    })
    vi.mocked(bookingApi.cancelBooking).mockResolvedValue(f.booking({ status: 'CANCELLED' }))
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderRoute('/my-bookings')

    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(bookingApi.cancelBooking).toHaveBeenCalledWith('STABCD2345'))
    expect(confirmSpy.mock.calls[0][0]).toContain('Refund: ₹140.')
    confirmSpy.mockRestore()
  })

  it('does not cancel when the policy no longer allows it', async () => {
    signedIn()
    vi.mocked(bookingApi.listMyBookings).mockResolvedValue(f.page([f.booking({ status: 'CONFIRMED', cancellable: true })]))
    vi.mocked(bookingApi.getCancellationPreview).mockResolvedValue({
      allowed: false,
      refundAmount: 0,
      currency: 'INR',
      message: 'Bookings can only be cancelled up to 2 hours before the show.',
    })
    const user = userEvent.setup()
    renderRoute('/my-bookings')

    await user.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(await screen.findByText('Bookings can only be cancelled up to 2 hours before the show.')).toBeInTheDocument()
    expect(bookingApi.cancelBooking).not.toHaveBeenCalled()
  })

  it('never shows tickets for a booking that is not confirmed', async () => {
    signedIn()
    vi.mocked(bookingApi.getBooking).mockResolvedValue(f.booking())
    renderRoute('/bookings/STABCD2345/confirmation')
    expect(await screen.findByRole('heading', { name: 'This booking is awaiting payment' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Tickets' })).not.toBeInTheDocument()
  })

  it('reports an expired hold at checkout', async () => {
    signedIn()
    vi.mocked(bookingApi.getBooking).mockResolvedValue(f.booking({ status: 'EXPIRED' }))
    renderRoute('/checkout/STABCD2345')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Your seat hold has expired' })).toBeInTheDocument())
  })
})
