import { describe, expect, it } from 'vitest'

import { formatCountdown, formatCurrency, formatDuration, formatTime, toLocalDateKey } from './format'
import { pageItems } from './pagination'
import { rules, validate } from './validation'

describe('format', () => {
  it('formats rupees without trailing zeros', () => {
    expect(formatCurrency('250.00')).toBe('₹250')
    expect(formatCurrency('199.5')).toBe('₹199.5')
  })

  it('formats countdowns', () => {
    expect(formatCountdown(605_000)).toBe('10:05')
    expect(formatCountdown(-5)).toBe('0:00')
  })

  it('formats durations', () => {
    expect(formatDuration(148)).toBe('2h 28m')
    expect(formatDuration(120)).toBe('2h')
    expect(formatDuration(45)).toBe('45m')
  })

  it('shows UTC instants in the venue time zone', () => {
    // 13:30 UTC is 19:00 in India (UTC+05:30).
    expect(formatTime('2030-01-15T13:30:00Z', 'Asia/Kolkata')).toMatch(/7:00\s?pm/i)
    expect(toLocalDateKey('2030-01-15T20:00:00Z', 'Asia/Kolkata')).toBe('2030-01-16')
  })
})

describe('pageItems', () => {
  it('collapses distant pages into gaps', () => {
    expect(pageItems(1, 3)).toEqual([1, 2, 3])
    expect(pageItems(5, 10)).toEqual([1, 'gap-4', 4, 5, 6, 'gap-10', 10])
  })
})

describe('validate', () => {
  const schema = {
    email: [rules.required('Email'), rules.email()],
    password: [rules.required('Password'), rules.minLength('Password', 8), rules.password()],
    confirm: [rules.matches('password', 'Passwords do not match')],
  }

  it('returns the first failing rule per field', () => {
    expect(validate({ email: '', password: 'short', confirm: 'x' }, schema)).toEqual({
      email: 'Email is required',
      password: 'Password must be at least 8 characters',
      confirm: 'Passwords do not match',
    })
  })

  it('passes valid input', () => {
    expect(validate({ email: 'a@example.com', password: 'secret123', confirm: 'secret123' }, schema)).toEqual({})
  })
})
