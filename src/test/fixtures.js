// API-shaped test data (mirrors the backend DTOs). Used only by tests.

export const page = (content, { page: number = 0, size = 12, totalElements = content.length } = {}) => ({
  content,
  page: number,
  size,
  totalElements,
  totalPages: Math.max(1, Math.ceil(totalElements / size)),
})

export const venue = {
  id: 1,
  slug: 'lumiere',
  name: 'Lumiere Multiplex',
  type: 'CINEMA',
  addressLine1: 'Senapati Bapat Marg',
  city: 'Mumbai',
  state: 'Maharashtra',
  timeZone: 'Asia/Kolkata',
}

export const movie = {
  id: 1,
  slug: 'monsoon-express',
  title: 'Monsoon Express',
  synopsis: 'A railway detective has one night to stop a heist.',
  durationMinutes: 148,
  releaseDate: '2026-10-15',
  language: 'Hindi',
  certification: 'UA',
  status: 'NOW_SHOWING',
  genres: [
    { slug: 'action', name: 'Action' },
    { slug: 'thriller', name: 'Thriller' },
  ],
  rating: { average: 4.5, count: 2 },
  posterUrl: null,
  newRelease: false,
}

export const movieDetail = {
  ...movie,
  director: 'Kabir Rao',
  cast: ['Vikram Sethi'],
  backdropUrl: null,
  trailerUrl: null,
  reviews: [],
}

export const event = {
  id: 7,
  slug: 'neon-nights-live',
  title: 'Neon Nights Live',
  category: 'CONCERT',
  categoryLabel: 'Concerts',
  organizerName: 'Pulse Collective',
  imageUrl: null,
  nextStartsAt: '2030-01-15T13:30:00Z',
  nextVenue: venue,
  priceFrom: 1499,
  upcomingDates: 1,
}

export const user = {
  id: 42,
  email: 'asha@example.com',
  fullName: 'Asha Rao',
  phoneNumber: null,
  role: 'USER',
  createdAt: '2026-10-01T00:00:00Z',
}

export const session = (overrides = {}) => ({
  accessToken: 'access-token',
  tokenType: 'Bearer',
  expiresAt: '2030-01-01T00:00:00Z',
  expiresIn: 900,
  user: { ...user, ...overrides },
})

export const inventory = {
  type: 'MOVIE',
  id: 1013,
  title: 'Monsoon Express',
  subtitle: 'UA · Hindi · 2D',
  parentSlug: 'monsoon-express',
  startsAt: '2030-01-15T13:30:00Z',
  venue,
  screenName: 'Audi 1',
  seatingType: 'RESERVED',
  rows: [
    {
      label: 'A',
      seats: [
        { id: 11, label: 'A1', row: 'A', number: 1, type: 'STANDARD', price: 280, status: 'AVAILABLE' },
        { id: 12, label: 'A2', row: 'A', number: 2, type: 'STANDARD', price: 280, status: 'UNAVAILABLE' },
        { id: 13, label: 'A3', row: 'A', number: 3, type: 'STANDARD', price: 280, status: 'AVAILABLE' },
      ],
    },
  ],
  capacity: null,
  remaining: null,
  basePrice: 280,
  premiumPrice: 380,
  feePerTicket: 25,
  maxPerBooking: 10,
  holdMinutes: 10,
  currency: 'INR',
  bookable: true,
}

export const booking = (overrides = {}) => ({
  reference: 'STABCD2345',
  status: 'PENDING',
  type: 'MOVIE',
  title: 'Monsoon Express',
  subtitle: 'UA · Hindi · 2D',
  parentSlug: 'monsoon-express',
  showId: 1013,
  startsAt: '2030-01-15T13:30:00Z',
  venue,
  screenName: 'Audi 1',
  seatingType: 'RESERVED',
  items: [{ seatLabel: 'A1', seatType: 'STANDARD', unitPrice: 280 }],
  ticketCount: 1,
  subtotal: 280,
  fees: 25,
  total: 305,
  currency: 'INR',
  holdExpiresAt: new Date(Date.now() + 9 * 60_000).toISOString(),
  createdAt: '2030-01-01T00:00:00Z',
  confirmedAt: null,
  cancelledAt: null,
  cancellable: true,
  tickets: [],
  payments: [],
  refunds: [],
  testPayment: false,
  ...overrides,
})

export const razorpayConfig = { provider: 'razorpay', available: true, testMode: true, keyId: 'rzp_test_showtime' }

export const paymentSession = (overrides = {}) => ({
  paymentId: 41,
  status: 'PENDING',
  provider: 'sandbox',
  testMode: true,
  keyId: null,
  providerOrderId: 'order_sbx_1',
  amount: 305,
  amountMinor: 30500,
  currency: 'INR',
  bookingReference: 'STABCD2345',
  description: 'Monsoon Express · 1 ticket',
  customerName: 'Asha Rao',
  customerEmail: 'asha@example.com',
  holdExpiresAt: new Date(Date.now() + 9 * 60_000).toISOString(),
  ...overrides,
})
