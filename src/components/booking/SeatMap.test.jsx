import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SeatMap } from './SeatMap'

const rows = [
  {
    label: 'A',
    seats: [
      { id: 'A1', label: 'A1', number: 1, type: 'STANDARD', price: '250.00', status: 'AVAILABLE' },
      { id: 'A2', label: 'A2', number: 2, type: 'STANDARD', price: '250.00', status: 'UNAVAILABLE' },
      { id: 'A3', label: 'A3', number: 3, type: 'STANDARD', price: '250.00', status: 'AVAILABLE' },
    ],
  },
  {
    label: 'B',
    seats: [{ id: 'B1', label: 'B1', number: 1, type: 'PREMIUM', price: '400.00', status: 'AVAILABLE' }],
  },
]

describe('SeatMap', () => {
  it('describes each seat and toggles available seats', async () => {
    const onToggle = vi.fn()
    render(<SeatMap rows={rows} selectedIds={['A1']} onToggle={onToggle} />)

    const selected = screen.getByRole('button', { name: 'Seat A1, Standard, ₹250, selected' })
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Seat A2, Standard, ₹250, unavailable' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Seat B1, Premium, ₹400, available' }))
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 'B1' }))
  })

  it('groups rows into price tiers', () => {
    render(<SeatMap rows={rows} selectedIds={[]} onToggle={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Standard · ₹250' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Premium · ₹400' })).toBeInTheDocument()
  })

  it('disables unselected seats once the limit is reached', () => {
    render(<SeatMap rows={rows} selectedIds={['A1']} onToggle={() => {}} maxReached />)
    expect(screen.getByRole('button', { name: /Seat A1/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Seat A3/ })).toBeDisabled()
  })
})
