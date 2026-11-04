import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../api/client'
import { getHealth } from '../../api/healthApi'
import { BackendStatus } from './BackendStatus'

vi.mock('../../api/healthApi', () => ({ getHealth: vi.fn() }))

describe('BackendStatus', () => {
  beforeEach(() => {
    vi.mocked(getHealth).mockReset()
  })

  it('shows online when the API and database are up', async () => {
    vi.mocked(getHealth).mockResolvedValue({ status: 'UP', database: { status: 'UP', latencyMs: 2 } })
    render(<BackendStatus />)
    expect(screen.getByRole('status')).toHaveTextContent('Checking API')
    expect(await screen.findByText('API online')).toBeInTheDocument()
  })

  it('shows degraded when the database is down', async () => {
    vi.mocked(getHealth).mockResolvedValue({ status: 'DOWN', database: { status: 'DOWN', latencyMs: null } })
    render(<BackendStatus />)
    expect(await screen.findByText('API online · database unavailable')).toBeInTheDocument()
  })

  it('shows offline when the API cannot be reached', async () => {
    vi.mocked(getHealth).mockRejectedValue(new ApiError('Unable to reach ShowTime', { code: 'NETWORK' }))
    render(<BackendStatus />)
    expect(await screen.findByText('API offline')).toBeInTheDocument()
  })
})
