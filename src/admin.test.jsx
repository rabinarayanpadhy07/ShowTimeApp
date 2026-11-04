import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as adminApi from './api/adminApi'
import * as authApi from './api/authApi'
import * as catalogApi from './api/catalogApi'
import { ApiError } from './api/client'
import { getHealth } from './api/healthApi'
import * as f from './test/fixtures'
import { renderRoute } from './test/renderRoute'

vi.mock('./api/healthApi', () => ({ getHealth: vi.fn() }))
vi.mock('./api/catalogApi')
vi.mock('./api/bookingApi')
vi.mock('./api/authApi')
vi.mock('./api/adminApi')

const venueDetail = {
  id: 1,
  slug: 'lumiere',
  name: 'Lumiere Multiplex',
  venueType: 'CINEMA',
  addressLine1: 'Senapati Bapat Marg',
  city: 'Mumbai',
  countryCode: 'IN',
  timeZone: 'Asia/Kolkata',
  active: true,
  screens: [{ id: 3, name: 'Audi 1', screenType: 'STANDARD', capacity: 24, active: true, activeSeats: 24 }],
}

const movieRow = {
  id: 7,
  slug: 'monsoon-express',
  title: 'Monsoon Express',
  status: 'NOW_SHOWING',
  language: 'Hindi',
  durationMinutes: 142,
  releaseDate: '2026-10-01',
  posterUrl: null,
  ratingAverage: 4.2,
  upcomingShows: 12,
}

beforeEach(() => {
  vi.mocked(getHealth).mockResolvedValue({ status: 'UP', database: { status: 'UP', latencyMs: 1 } })
  vi.mocked(authApi.refresh).mockResolvedValue(f.session({ id: 1, role: 'ADMIN' }))
  vi.mocked(catalogApi.listGenres).mockResolvedValue([
    { slug: 'action', name: 'Action' },
    { slug: 'drama', name: 'Drama' },
  ])
  vi.mocked(adminApi.listAdminVenues).mockResolvedValue(f.page([{ ...venueDetail, screens: 1 }]))
  vi.mocked(adminApi.getAdminVenue).mockResolvedValue(venueDetail)
})

describe('admin dashboard', () => {
  it('shows sales metrics, a chart with a table view, and explains excluded test revenue', async () => {
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
    vi.mocked(adminApi.getMetrics).mockResolvedValue({
      from: '2026-10-01',
      to: '2026-10-02',
      currency: 'INR',
      totalBookings: 3,
      bookingsByStatus: { CONFIRMED: 2, CANCELLED: 1 },
      ticketsSold: 5,
      grossRevenue: 1500,
      refundedAmount: 250,
      netRevenue: 1250,
      averageOrderValue: 625,
      testModeRevenue: 300,
      paymentsByStatus: { SUCCEEDED: 2 },
      refundsByStatus: { PENDING: 0, PROCESSED: 1, FAILED: 1 },
      pendingRefundAmount: 0,
      upcoming: [],
      daily: [
        { date: '2026-10-01', bookings: 1, ticketsSold: 2, revenue: 500 },
        { date: '2026-10-02', bookings: 2, ticketsSold: 3, revenue: 1000 },
      ],
      recentBookings: [],
    })
    renderRoute('/admin')

    expect(await screen.findByText('133')).toBeInTheDocument()
    expect(await screen.findByText('Test payments are not counted')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review failed refunds' })).toHaveAttribute('href', '/admin/payments?tab=refunds')
    const chart = screen.getByRole('list', { name: 'Revenue per day' })
    expect(within(chart).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Show as table')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Admin sections' })).toBeInTheDocument()
  })
})

describe('catalog management', () => {
  it('creates a movie with a generated slug and the chosen genres', async () => {
    vi.mocked(adminApi.listAdminMovies).mockResolvedValue(f.page([movieRow]))
    vi.mocked(adminApi.createMovie).mockResolvedValue({ id: 8 })
    const user = userEvent.setup()
    renderRoute('/admin/movies')

    await user.click(await screen.findByRole('button', { name: 'New movie' }))
    const dialog = await screen.findByRole('dialog', { name: 'New movie' })
    await user.type(within(dialog).getByLabelText(/^Title/), "The Clockmaker's Daughter")
    expect(within(dialog).getByLabelText(/URL slug/)).toHaveValue('the-clockmakers-daughter')
    await user.type(within(dialog).getByLabelText(/Duration/), '128')
    await user.type(within(dialog).getByLabelText(/^Language/), 'English')
    await user.click(await within(dialog).findByLabelText('Drama'))
    await user.click(screen.getByRole('button', { name: 'Create movie' }))

    await waitFor(() => expect(adminApi.createMovie).toHaveBeenCalled())
    expect(vi.mocked(adminApi.createMovie).mock.calls[0][0]).toMatchObject({
      title: "The Clockmaker's Daughter",
      slug: 'the-clockmakers-daughter',
      durationMinutes: 128,
      language: 'English',
      status: 'COMING_SOON',
      genreSlugs: ['drama'],
      synopsis: null,
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('shows server validation and conflict messages in the form', async () => {
    vi.mocked(adminApi.listAdminMovies).mockResolvedValue(f.page([movieRow]))
    vi.mocked(adminApi.createMovie)
      .mockRejectedValueOnce(new ApiError('Validation failed', { status: 400, fieldErrors: [{ field: 'slug', message: 'must be lowercase words separated by hyphens' }] }))
      .mockRejectedValueOnce(new ApiError("A movie with slug 'x' already exists", { status: 409, code: 'CONFLICT' }))
    const user = userEvent.setup()
    renderRoute('/admin/movies')

    await user.click(await screen.findByRole('button', { name: 'New movie' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Create movie' }))
    expect(await within(dialog).findByText('Must be lowercase words separated by hyphens')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create movie' }))
    expect(await within(dialog).findByText("A movie with slug 'x' already exists")).toBeInTheDocument()
  })

  it('schedules a show in the venue time zone', async () => {
    vi.mocked(adminApi.listAdminMovies).mockResolvedValue(f.page([movieRow]))
    vi.mocked(adminApi.createShow).mockResolvedValue({ id: 99 })
    const user = userEvent.setup()
    renderRoute('/admin/movies')

    await user.click(await screen.findByRole('button', { name: 'Add show' }))
    const dialog = await screen.findByRole('dialog')
    await user.selectOptions(await within(dialog).findByLabelText(/^Venue/), '1')
    await user.selectOptions(await within(dialog).findByRole('combobox', { name: /^Screen/ }), '3')
    const startsAt = within(dialog).getByLabelText(/Starts at/)
    await user.clear(startsAt)
    await user.type(startsAt, '2030-11-02T19:00')
    await user.type(within(dialog).getByLabelText(/Base price/), '250')
    await user.click(screen.getByRole('button', { name: 'Schedule show' }))

    await waitFor(() => expect(adminApi.createShow).toHaveBeenCalled())
    expect(adminApi.createShow).toHaveBeenCalledWith(7, {
      screenId: 3,
      startsAt: '2030-11-02T13:30:00.000Z',
      format: 'TWO_D',
      language: 'Hindi',
      basePrice: 250,
      premiumPrice: null,
    })
  })
})

describe('scheduling', () => {
  const show = {
    id: 90,
    movieId: 7,
    movieTitle: 'Monsoon Express',
    venueId: 1,
    venueName: 'Lumiere Multiplex',
    screenId: 3,
    screenName: 'Audi 1',
    startsAt: '2030-11-02T13:30:00Z',
    endsAt: '2030-11-02T16:00:00Z',
    format: 'TWO_D',
    language: 'Hindi',
    basePrice: 250,
    premiumPrice: 350,
    status: 'SCHEDULED',
    seatsTotal: 24,
    seatsSold: 4,
    activeBookings: 2,
  }

  it('requires explicit consent before cancelling a show with bookings', async () => {
    vi.mocked(adminApi.listShows).mockResolvedValue(f.page([show]))
    vi.mocked(adminApi.cancelShow).mockResolvedValue({ id: 90, status: 'CANCELLED', bookingsCancelled: 2, refundsRequested: 1 })
    const user = userEvent.setup()
    renderRoute('/admin/schedules')

    expect(await screen.findByText('4 / 24')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel it' }))
    expect(await within(dialog).findByText(/Tick the box/)).toBeInTheDocument()
    expect(adminApi.cancelShow).not.toHaveBeenCalled()

    await user.click(within(dialog).getByLabelText(/Cancel 2 active booking/))
    await user.click(within(dialog).getByRole('button', { name: 'Cancel it' }))
    await waitFor(() => expect(adminApi.cancelShow).toHaveBeenCalledWith(90, true))
    expect(await screen.findByText(/2 booking\(s\) cancelled, 1 refund\(s\) requested/)).toBeInTheDocument()
  })

  it('switches to event dates with a linkable tab', async () => {
    vi.mocked(adminApi.listShows).mockResolvedValue(f.page([]))
    vi.mocked(adminApi.listEventSchedules).mockResolvedValue(f.page([]))
    const user = userEvent.setup()
    const { router } = renderRoute('/admin/schedules')
    await user.click(await screen.findByRole('tab', { name: 'Event dates' }))
    expect(screen.getByRole('tab', { name: 'Event dates' })).toHaveAttribute('aria-selected', 'true')
    expect(router.state.location.search).toBe('?tab=events')
    await waitFor(() => expect(adminApi.listEventSchedules).toHaveBeenCalledWith(expect.objectContaining({ status: 'SCHEDULED', page: 0 })))
  })
})

describe('venues and seat maps', () => {
  it('edits a seat map row by row and saves the whole layout', async () => {
    vi.mocked(adminApi.getSeatLayout).mockResolvedValue({
      screenId: 3,
      screenName: 'Audi 1',
      capacity: 24,
      activeSeats: 24,
      rows: ['A', 'B'].map((label) => ({
        label,
        seats: Array.from({ length: 12 }, (_, i) => ({ id: i, number: i + 1, seatType: 'STANDARD', section: null, active: true })),
      })),
    })
    vi.mocked(adminApi.replaceSeatLayout).mockImplementation(async (screenId, rows) => ({
      screenId,
      screenName: 'Audi 1',
      capacity: 34,
      activeSeats: 34,
      rows: rows.map((row) => ({
        label: row.label,
        seats: Array.from({ length: row.seatCount }, (_, i) => ({ id: i, number: i + 1, seatType: row.seatType, section: row.section, active: true })),
      })),
    }))
    const user = userEvent.setup()
    renderRoute('/admin/venues/1')

    await user.click(await screen.findByRole('button', { name: 'Seat map' }))
    expect(await screen.findByText('2 rows · 24 seats')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add row' }))
    await user.selectOptions(screen.getByLabelText('Row C seat type'), 'RECLINER')
    const count = screen.getByLabelText('Row C seat count')
    await user.clear(count)
    await user.type(count, '10')
    expect(screen.getByText('3 rows · 34 seats')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save seat map' }))

    await waitFor(() => expect(adminApi.replaceSeatLayout).toHaveBeenCalled())
    expect(vi.mocked(adminApi.replaceSeatLayout).mock.calls[0]).toEqual([
      3,
      [
        { label: 'A', seatCount: 12, seatType: 'STANDARD', section: null },
        { label: 'B', seatCount: 12, seatType: 'STANDARD', section: null },
        { label: 'C', seatCount: 10, seatType: 'RECLINER', section: null },
      ],
    ])
    expect(await screen.findByText(/Seat map saved/)).toBeInTheDocument()
  })

  it('reports a seat map the server refuses', async () => {
    vi.mocked(adminApi.getSeatLayout).mockResolvedValue({ screenId: 3, screenName: 'Audi 1', capacity: 0, activeSeats: 0, rows: [] })
    vi.mocked(adminApi.replaceSeatLayout).mockRejectedValue(
      new ApiError('3 seat(s) on this screen are booked for upcoming shows; the seat map cannot change now.', { status: 409 }),
    )
    const user = userEvent.setup()
    renderRoute('/admin/venues/1')
    await user.click(await screen.findByRole('button', { name: 'Seat map' }))
    await user.click(await screen.findByRole('button', { name: 'Add row' }))
    await user.click(screen.getByRole('button', { name: 'Save seat map' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('3 seat(s) on this screen are booked for upcoming shows')
  })
})

describe('operations', () => {
  it('never offers admins actions on their own account', async () => {
    vi.mocked(adminApi.listUsers).mockResolvedValue(
      f.page([
        { id: 1, email: 'admin@showtime.local', fullName: 'Asha Admin', role: 'ADMIN', enabled: true, createdAt: '2026-01-01T00:00:00Z', bookings: 0 },
        { id: 2, email: 'ravi@example.com', fullName: 'Ravi Kumar', role: 'USER', enabled: true, createdAt: '2026-01-02T00:00:00Z', bookings: 3 },
      ]),
    )
    vi.mocked(adminApi.updateUser).mockResolvedValue({})
    const user = userEvent.setup()
    renderRoute('/admin/users')

    const own = (await screen.findByText('admin@showtime.local')).closest('tr')
    expect(within(own).queryByRole('button')).not.toBeInTheDocument()
    const other = screen.getByText('ravi@example.com').closest('tr')
    await user.click(within(other).getByRole('button', { name: 'Make admin' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Make administrator' }))
    await waitFor(() => expect(adminApi.updateUser).toHaveBeenCalledWith(2, { role: 'ADMIN' }))
  })

  it('offers reconciliation only for open payments and retries failed refunds', async () => {
    const payment = (id, status) => ({ id, bookingReference: 'STABCD2345', provider: 'razorpay', amount: 305, currency: 'INR', status, testMode: true, createdAt: '2026-10-01T00:00:00Z' })
    vi.mocked(adminApi.listPayments).mockResolvedValue(f.page([payment(1, 'PENDING'), payment(2, 'SUCCEEDED')]))
    vi.mocked(adminApi.listRefunds).mockResolvedValue(
      f.page([{ id: 5, bookingReference: 'STABCD2345', paymentId: 2, amount: 305, currency: 'INR', reason: 'SHOW_CANCELLED', status: 'FAILED', failureReason: 'Insufficient balance', createdAt: '2026-10-01T00:00:00Z' }]),
    )
    vi.mocked(adminApi.reconcilePayment).mockResolvedValue(undefined)
    vi.mocked(adminApi.retryRefund).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderRoute('/admin/payments')

    expect(await screen.findAllByRole('button', { name: 'Ask provider now' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Ask provider now' }))
    await waitFor(() => expect(adminApi.reconcilePayment).toHaveBeenCalledWith(1))
    expect(await screen.findByText('Payment #1 checked with the provider.')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Refunds' }))
    expect(await screen.findByText('Insufficient balance')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(adminApi.retryRefund).toHaveBeenCalledWith(5))
  })

  it('opens a booking with its payments, tickets and emails', async () => {
    vi.mocked(adminApi.listAllBookings).mockResolvedValue(
      f.page([{ reference: 'STABCD2345', status: 'CONFIRMED', type: 'MOVIE', title: 'Monsoon Express', customerEmail: 'ravi@example.com', startsAt: '2030-01-15T13:30:00Z', venueName: 'Lumiere Multiplex', tickets: 1, total: 305, currency: 'INR', createdAt: '2030-01-01T00:00:00Z', testPayment: true }]),
    )
    vi.mocked(adminApi.getAdminBooking).mockResolvedValue({
      booking: f.booking({
        status: 'CONFIRMED',
        tickets: [{ code: 'TICKET1234567890', seatLabel: 'A1', status: 'VALID', checkedInAt: null }],
        payments: [{ id: 41, provider: 'razorpay', status: 'SUCCEEDED', amount: 305, testMode: true, createdAt: '2030-01-01T00:00:00Z' }],
        testPayment: true,
      }),
      customer: { id: 2, fullName: 'Ravi Kumar', email: 'ravi@example.com' },
      notifications: [{ type: 'BOOKING_CONFIRMED', status: 'SENT', attempts: 1, createdAt: '2030-01-01T00:00:00Z', sentAt: '2030-01-01T00:00:10Z' }],
    })
    const user = userEvent.setup()
    renderRoute('/admin/bookings?q=STABCD2345')

    await waitFor(() => expect(adminApi.listAllBookings).toHaveBeenCalledWith(expect.objectContaining({ q: 'STABCD2345' })))
    await user.click(await screen.findByRole('button', { name: 'STABCD2345' }))
    const dialog = await screen.findByRole('dialog', { name: 'Booking STABCD2345' })
    expect(await within(dialog).findByText('TICKET1234567890')).toBeInTheDocument()
    expect(within(dialog).getByText('Test payment')).toBeInTheDocument()
    expect(within(dialog).getByText('booking confirmed')).toBeInTheDocument()
  })
})

describe('ticket check-in', () => {
  const scan = (result, extra = {}) => ({
    result,
    message: 'msg',
    ticketCode: 'TICKET1234567890',
    bookingReference: 'STABCD2345',
    title: 'Monsoon Express',
    startsAt: '2030-01-15T13:30:00Z',
    venueName: 'Lumiere Multiplex',
    screenName: 'Audi 1',
    seatLabel: 'A1',
    checkedInAt: null,
    ...extra,
  })

  it('admits a valid ticket, then warns on a second scan', async () => {
    vi.mocked(adminApi.checkInTicket)
      .mockResolvedValueOnce(scan('CHECKED_IN', { checkedInAt: '2030-01-15T12:00:00Z' }))
      .mockResolvedValueOnce(scan('ALREADY_USED', { checkedInAt: '2030-01-15T12:00:00Z' }))
    const user = userEvent.setup()
    renderRoute('/admin/check-in')

    const input = await screen.findByLabelText(/QR or ticket code/)
    await user.type(input, 'STKT1.TICKET1234567890.SIG{Enter}')
    expect(await screen.findByText('Admit')).toBeInTheDocument()
    expect(within(screen.getByRole('status')).getByText('A1')).toBeInTheDocument()
    // The check-in is listed in this device's history.
    expect(screen.getByRole('complementary', { name: 'Checked in here' })).toHaveTextContent('A1')
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()

    await user.type(input, 'STKT1.TICKET1234567890.SIG{Enter}')
    expect(await screen.findByText('Already used: do not admit')).toBeInTheDocument()
    expect(adminApi.checkInTicket).toHaveBeenLastCalledWith('STKT1.TICKET1234567890.SIG')
  })

  it('validates without redeeming', async () => {
    vi.mocked(adminApi.validateTicket).mockResolvedValue({ result: 'INVALID', message: 'This QR code is not a valid ShowTime ticket.' })
    const user = userEvent.setup()
    renderRoute('/admin/check-in')
    await user.type(await screen.findByLabelText(/QR or ticket code/), 'garbage')
    await user.click(screen.getByRole('button', { name: 'Validate only' }))
    expect(await screen.findByText('Invalid ticket: do not admit')).toBeInTheDocument()
    expect(adminApi.checkInTicket).not.toHaveBeenCalled()
  })
})
