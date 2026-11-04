import { apiClient, refreshSession } from './client'

// Authentication endpoints. Responses carry the access token; the refresh token is set by the
// server as an HttpOnly cookie and is never visible to this code.

export async function login({ email, password }) {
  return (await apiClient.post('/auth/login', { email, password }, { skipAuth: true, skipRefresh: true })).data
}

export async function register({ fullName, email, phoneNumber, password }) {
  return (
    await apiClient.post('/auth/register', { fullName, email, phoneNumber, password }, { skipAuth: true, skipRefresh: true })
  ).data
}

/** Public sign-in options, e.g. { googleClientId } (null when Google sign-in is off). */
export async function getAuthConfig() {
  return (await apiClient.get('/auth/config', { skipAuth: true, skipRefresh: true })).data
}

/** Exchanges a Google ID token (from Google Identity Services) for a ShowTime session. */
export async function loginWithGoogle(credential) {
  return (await apiClient.post('/auth/google', { credential }, { skipAuth: true, skipRefresh: true })).data
}

export function refresh() {
  return refreshSession()
}

export async function logout() {
  await apiClient.post('/auth/logout', null, { skipAuth: true, skipRefresh: true })
}

export async function getMe() {
  return (await apiClient.get('/users/me')).data
}

export async function updateProfile({ fullName, phoneNumber }) {
  return (await apiClient.patch('/users/me', { fullName, phoneNumber })).data
}

export async function changePassword({ currentPassword, newPassword }) {
  return (await apiClient.post('/users/me/password', { currentPassword, newPassword })).data
}
