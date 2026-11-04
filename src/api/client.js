import axios from 'axios'

import { env } from '../config/env'
import { getAccessToken, notifySessionExpired, setAccessToken } from './session'

/**
 * Error type used by every API call. Mirrors the backend ApiError body:
 * { status, message, fieldErrors: [{ field, message }] }.
 */
export class ApiError extends Error {
  constructor(message, { status = null, code = 'UNKNOWN', fieldErrors = [], retryAfter = null, cause } = {}) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.retryAfter = retryAfter
  }
}

const MESSAGES_BY_STATUS = {
  400: 'Some of the information provided is invalid.',
  401: 'Please sign in to continue.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  409: 'That change conflicts with the latest data. Please refresh and try again.',
  422: 'This request could not be processed.',
  429: 'Too many attempts. Please wait a moment and try again.',
  503: 'ShowTime is temporarily unavailable. Please try again shortly.',
}

function codeForStatus(status) {
  if (status === 400) return 'VALIDATION'
  if (status === 401) return 'UNAUTHENTICATED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 422) return 'UNPROCESSABLE'
  if (status === 429) return 'RATE_LIMITED'
  if (status >= 500) return 'SERVER'
  return 'HTTP'
}

/** Converts anything thrown by axios into an ApiError with a user-presentable message. */
export function toApiError(error) {
  if (error instanceof ApiError) return error

  if (axios.isCancel(error)) {
    return new ApiError('The request was cancelled.', { code: 'CANCELLED', cause: error })
  }

  if (error?.response) {
    const { status, data, headers } = error.response
    const message =
      typeof data?.message === 'string' && data.message && data.message !== 'Validation failed'
        ? data.message
        : MESSAGES_BY_STATUS[status] || 'Something went wrong. Please try again.'
    const retryAfter = Number(headers?.['retry-after']) || null
    return new ApiError(message, {
      status,
      code: codeForStatus(status),
      fieldErrors: Array.isArray(data?.fieldErrors) ? data.fieldErrors : [],
      retryAfter,
      cause: error,
    })
  }

  if (error?.code === 'ECONNABORTED') {
    return new ApiError('The server took too long to respond. Please try again.', { code: 'TIMEOUT', cause: error })
  }

  if (error?.request) {
    return new ApiError('Unable to reach ShowTime. Check your connection and try again.', {
      code: 'NETWORK',
      cause: error,
    })
  }

  return new ApiError(error?.message || 'Something went wrong. Please try again.', { cause: error })
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  // Lets the browser send/receive the HttpOnly refresh cookie (path /api/auth only).
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    // Required by the backend on cookie-authenticated endpoints (CSRF defence).
    'X-Requested-With': 'XMLHttpRequest',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// One refresh at a time: concurrent 401s wait for the same refresh instead of each rotating
// the refresh token (which the server would treat as token reuse).
let refreshInFlight = null

export function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = apiClient
      .post('/auth/refresh', null, { skipAuth: true, skipRefresh: true })
      .then((response) => {
        setAccessToken(response.data.accessToken)
        return response.data
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config
    const status = error?.response?.status
    // An expired access token: refresh once, then replay the original request.
    if (status === 401 && original && !original.skipRefresh && !original.retried && getAccessToken()) {
      original.retried = true
      try {
        await refreshSession()
        return apiClient(original)
      } catch {
        notifySessionExpired()
      }
    }
    return Promise.reject(toApiError(error))
  },
)

/** Random Idempotency-Key for booking and payment requests. */
export function newIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}
