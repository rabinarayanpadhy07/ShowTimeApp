// In-memory access token. It is never written to localStorage/sessionStorage, so injected
// scripts cannot harvest it from storage; the long-lived refresh token is an HttpOnly cookie
// the browser sends only to /api/auth.

let accessToken = null
const expiryListeners = new Set()

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  accessToken = token || null
}

/** Called by the API client when a session can no longer be refreshed. */
export function notifySessionExpired() {
  accessToken = null
  expiryListeners.forEach((listener) => listener())
}

export function onSessionExpired(listener) {
  expiryListeners.add(listener)
  return () => expiryListeners.delete(listener)
}
