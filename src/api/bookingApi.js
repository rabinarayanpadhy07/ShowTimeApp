import { apiClient } from './client'

// Booking engine endpoints. The client only says WHAT it wants (show + seat ids, or schedule +
// quantity); prices, fees, totals and availability always come from the server.

export async function getShowInventory(showId) {
  return (await apiClient.get(`/shows/${showId}/inventory`)).data
}

export async function getScheduleInventory(scheduleId) {
  return (await apiClient.get(`/event-schedules/${scheduleId}/inventory`)).data
}

export async function quote(selection) {
  return (await apiClient.post('/bookings/quote', selection)).data
}

/** Holds seats/tickets. Reuse the same idempotencyKey when retrying the same request. */
export async function createBooking(selection, idempotencyKey) {
  return (await apiClient.post('/bookings', selection, { headers: { 'Idempotency-Key': idempotencyKey } })).data
}

export async function getBooking(reference) {
  return (await apiClient.get(`/bookings/${encodeURIComponent(reference)}`)).data
}

export async function listMyBookings({ page = 0, size = 10 } = {}) {
  return (await apiClient.get('/bookings', { params: { page, size } })).data
}

export async function cancelBooking(reference) {
  return (await apiClient.post(`/bookings/${encodeURIComponent(reference)}/cancel`)).data
}

/** Refund amount and whether cancelling is allowed right now; the same rule the server applies on cancel. */
export async function getCancellationPreview(reference) {
  return (await apiClient.get(`/bookings/${encodeURIComponent(reference)}/cancellation`)).data
}

/** The owner's tickets with signed QR codes (only for confirmed bookings). */
export async function getTickets(reference) {
  return (await apiClient.get(`/bookings/${encodeURIComponent(reference)}/tickets`)).data
}

/**
 * Starts (or resumes) payment: the server creates a provider order for its own total and returns
 * what the provider's checkout needs. No amount or method is sent from the browser.
 */
export async function startPayment(reference, idempotencyKey) {
  return (
    await apiClient.post(`/bookings/${encodeURIComponent(reference)}/payments`, null, {
      headers: { 'Idempotency-Key': idempotencyKey },
    })
  ).data
}

/** Hands the checkout's signed result to the server, which verifies it with the provider. */
export async function confirmPayment(paymentId, { providerOrderId, providerPaymentId, signature }) {
  return (await apiClient.post(`/payments/${paymentId}/confirm`, { providerOrderId, providerPaymentId, signature })).data
}

export async function getPaymentStatus(paymentId) {
  return (await apiClient.get(`/payments/${paymentId}`)).data
}

export async function getPaymentConfig() {
  return (await apiClient.get('/payments/config')).data
}
