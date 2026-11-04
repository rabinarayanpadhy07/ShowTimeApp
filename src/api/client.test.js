import { describe, expect, it } from 'vitest'

import { ApiError, newIdempotencyKey, toApiError } from './client'

describe('toApiError', () => {
  it('uses the backend ApiError body when present', () => {
    const error = toApiError({
      response: {
        status: 409,
        data: { message: 'These seats are no longer available: A5', fieldErrors: [] },
      },
    })
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.code).toBe('CONFLICT')
    expect(error.message).toBe('These seats are no longer available: A5')
  })

  it('keeps field errors and replaces the generic validation message', () => {
    const error = toApiError({
      response: { status: 400, data: { message: 'Validation failed', fieldErrors: [{ field: 'email', message: 'must be a well-formed email address' }] } },
    })
    expect(error.code).toBe('VALIDATION')
    expect(error.message).toBe('Some of the information provided is invalid.')
    expect(error.fieldErrors).toEqual([{ field: 'email', message: 'must be a well-formed email address' }])
  })

  it('reads Retry-After for rate limits', () => {
    const error = toApiError({ response: { status: 429, data: { message: 'Too many failed sign-in attempts.' }, headers: { 'retry-after': '120' } } })
    expect(error.code).toBe('RATE_LIMITED')
    expect(error.retryAfter).toBe(120)
  })

  it('reports network failures and timeouts', () => {
    expect(toApiError({ request: {}, message: 'Network Error' }).code).toBe('NETWORK')
    expect(toApiError({ code: 'ECONNABORTED', request: {} }).code).toBe('TIMEOUT')
  })

  it('returns existing ApiErrors unchanged', () => {
    const original = new ApiError('x', { code: 'NOT_FOUND' })
    expect(toApiError(original)).toBe(original)
  })
})

describe('newIdempotencyKey', () => {
  it('produces unique keys the backend accepts', () => {
    const a = newIdempotencyKey()
    expect(a).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
    expect(newIdempotencyKey()).not.toBe(a)
  })
})
