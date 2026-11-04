import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'
import { DateSelector } from './DateSelector'
import { FilterChips } from './FilterChips'
import { Modal } from './Modal'
import { Pagination } from './Pagination'
import { EmptyState, ErrorState } from './States'

describe('Button', () => {
  it('is disabled and busy while loading', () => {
    render(<Button loading>Pay</Button>)
    const button = screen.getByRole('button', { name: 'Pay' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })
})

describe('Pagination', () => {
  it('marks the current page and reports page changes', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />)

    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    await userEvent.click(screen.getByRole('button', { name: /previous/i }))
    expect(onPageChange.mock.calls).toEqual([[3], [1]])
  })

  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('States', () => {
  it('ErrorState offers a retry', async () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Server unavailable" onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable')
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('EmptyState renders its title and action', () => {
    render(<EmptyState title="No movies" action={<button type="button">Reset</button>} />)
    expect(screen.getByRole('heading', { name: 'No movies' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })
})

describe('FilterChips and DateSelector', () => {
  it('FilterChips exposes pressed state', async () => {
    const onChange = vi.fn()
    render(<FilterChips label="Genre" value="drama" options={[{ value: 'drama', label: 'Drama' }, { value: 'comedy', label: 'Comedy' }]} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Drama' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Comedy' }))
    expect(onChange).toHaveBeenCalledWith('comedy')
  })

  it('DateSelector labels the first day as today', async () => {
    const onChange = vi.fn()
    render(<DateSelector dates={['2030-01-15', '2030-01-16']} value="2030-01-15" onChange={onChange} />)
    expect(screen.getByRole('button', { name: /^Today, Tue 15 Jan/ })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: /Wed 16 Jan/ }))
    expect(onChange).toHaveBeenCalledWith('2030-01-16')
  })
})

describe('Modal', () => {
  it('is an accessible dialog that closes on Escape', async () => {
    const onClose = vi.fn()
    render(
      <Modal open title="Seat guide" onClose={onClose}>
        Content
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Seat guide' })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders nothing when closed', () => {
    render(
      <Modal open={false} title="Hidden" onClose={() => {}}>
        Content
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
