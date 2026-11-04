import { apiClient } from './client'

// Admin endpoints. The UI hides them from non-admins, but only the server's role check
// (ROLE_ADMIN in the signed access token) actually protects them.

const get = async (url, params) => (await apiClient.get(url, { params: clean(params) })).data
const post = async (url, body) => (await apiClient.post(url, body)).data
const put = async (url, body) => (await apiClient.put(url, body)).data
const patch = async (url, body) => (await apiClient.patch(url, body)).data

/** Drops empty filters so they are not sent as `?status=`. */
function clean(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined))
}

// ---------------------------------------------------------------- dashboard

export const getOverview = () => get('/admin/overview')
export const getMetrics = ({ from, to } = {}) => get('/admin/metrics', { from, to })

// ---------------------------------------------------------------- catalog

export const listAdminMovies = (params) => get('/admin/movies', params)
export const getAdminMovie = (id) => get(`/admin/movies/${id}`)
export const createMovie = (body) => post('/admin/movies', body)
export const updateMovie = (id, body) => put(`/admin/movies/${id}`, body)
export const setMovieStatus = (id, status) => patch(`/admin/movies/${id}/status`, { status })

export const listAdminEvents = (params) => get('/admin/events', params)
export const getAdminEvent = (id) => get(`/admin/events/${id}`)
export const createEvent = (body) => post('/admin/events', body)
export const updateEvent = (id, body) => put(`/admin/events/${id}`, body)
export const setEventStatus = (id, status) => patch(`/admin/events/${id}/status`, { status })

// ---------------------------------------------------------------- scheduling

export const listShows = (params) => get('/admin/shows', params)
export const createShow = (movieId, body) => post(`/admin/movies/${movieId}/shows`, body)
export const updateShow = (id, body) => put(`/admin/shows/${id}`, body)
export const cancelShow = (id, refundBookings) => post(`/admin/shows/${id}/cancel`, { refundBookings })

export const listEventSchedules = (params) => get('/admin/event-schedules', params)
export const createEventSchedule = (eventId, body) => post(`/admin/events/${eventId}/schedules`, body)
export const updateEventSchedule = (id, body) => put(`/admin/event-schedules/${id}`, body)
export const cancelEventSchedule = (id, refundBookings) => post(`/admin/event-schedules/${id}/cancel`, { refundBookings })

// ---------------------------------------------------------------- venues

export const listAdminVenues = (params) => get('/admin/venues', params)
export const getAdminVenue = (id) => get(`/admin/venues/${id}`)
export const createVenue = (body) => post('/admin/venues', body)
export const updateVenue = (id, body) => put(`/admin/venues/${id}`, body)
export const createScreen = (venueId, body) => post(`/admin/venues/${venueId}/screens`, body)
export const updateScreen = (id, body) => put(`/admin/screens/${id}`, body)
export const getSeatLayout = (screenId) => get(`/admin/screens/${screenId}/seats`)
export const replaceSeatLayout = (screenId, rows) => put(`/admin/screens/${screenId}/seats`, { rows })

// ---------------------------------------------------------------- operations

export const listAllBookings = (params) => get('/admin/bookings', params)
export const getAdminBooking = (reference) => get(`/admin/bookings/${encodeURIComponent(reference)}`)
export const listPayments = (params) => get('/admin/payments', params)
export const reconcilePayment = (id) => post(`/admin/payments/${id}/reconcile`)
export const listRefunds = (params) => get('/admin/refunds', params)
export const retryRefund = (id) => post(`/admin/refunds/${id}/retry`)
export const listUsers = (params) => get('/admin/users', params)
export const updateUser = (id, body) => patch(`/admin/users/${id}`, body)
export const listAuditLogs = (params) => get('/admin/audit-logs', params)

// ---------------------------------------------------------------- tickets

export const validateTicket = (payload) => post('/admin/tickets/validate', { payload })

/** 409 (already used) and 422 (not valid) still carry a scan result, so they are not errors here. */
export async function checkInTicket(payload) {
  const response = await apiClient.post(
    '/admin/tickets/check-in',
    { payload },
    { validateStatus: (status) => status === 200 || status === 409 || status === 422 },
  )
  return response.data
}
