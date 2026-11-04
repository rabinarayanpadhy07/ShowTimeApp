import { niceMax } from '../../lib/adminHelpers'
import { formatCurrency, formatReleaseDate } from '../../lib/format'

const compact = (amount, currency) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(amount)

/**
 * Revenue per day as columns (one series, so the heading names it and there is no legend).
 * Each column shows its figures on hover or keyboard focus; a table view lists every value.
 */
export function DailyRevenueChart({ daily, currency }) {
  const values = daily.map((day) => Number(day.revenue))
  const max = niceMax(Math.max(0, ...values))
  const peak = values.indexOf(Math.max(...values))
  const ticks = [max, max / 2, 0]

  return (
    <figure className="space-y-4">
      <div className="relative h-56 pl-14">
        {ticks.map((tick) => (
          <div
            key={tick}
            aria-hidden="true"
            className="absolute right-0 left-14 border-t border-line"
            style={{ top: `${(1 - tick / max) * 100}%` }}
          >
            <span className="absolute -top-2 -left-14 w-12 text-right text-xs text-ink-muted">{compact(tick, currency)}</span>
          </div>
        ))}
        <ol aria-label="Revenue per day" className="relative flex h-full items-end gap-0.5">
          {daily.map((day, index) => {
            const height = (values[index] / max) * 100
            const label = `${formatReleaseDate(day.date)}: ${formatCurrency(day.revenue, currency)}, ${day.bookings} bookings, ${day.ticketsSold} tickets`
            return (
              <li key={day.date} className="group relative flex h-full flex-1 items-end justify-center">
                {/* The hit target is the whole column slot, wider and taller than the bar. */}
                <span
                  tabIndex={0}
                  aria-label={label}
                  className="absolute inset-0 rounded-sm focus-visible:outline-2 focus-visible:outline-ink"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none w-full max-w-6 rounded-t-[4px] bg-primary-strong group-hover:opacity-80"
                  style={{ height: `${height}%`, minHeight: values[index] > 0 ? 2 : 0 }}
                />
                {index === peak && values[index] > 0 && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute text-xs font-semibold whitespace-nowrap text-ink"
                    style={{ bottom: `calc(${height}% + 4px)` }}
                  >
                    {compact(values[index], currency)}
                  </span>
                )}
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full z-10 mb-2 hidden w-max rounded-control bg-ink px-3 py-2 text-xs text-white shadow-elevated group-focus-within:block group-hover:block"
                >
                  <span className="block font-semibold">{formatReleaseDate(day.date)}</span>
                  {formatCurrency(day.revenue, currency)} · {day.bookings} bookings · {day.ticketsSold} tickets
                </span>
              </li>
            )
          })}
        </ol>
      </div>
      <div aria-hidden="true" className="flex justify-between pl-14 text-xs text-ink-muted">
        <span>{daily.length > 0 && formatReleaseDate(daily[0].date)}</span>
        <span>{daily.length > 0 && formatReleaseDate(daily[daily.length - 1].date)}</span>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-ink">Show as table</summary>
        <div className="mt-3 max-h-72 overflow-auto rounded-control border border-line">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Daily bookings, tickets and revenue</caption>
            <thead className="sticky top-0 bg-surface-subtle text-xs text-ink-muted uppercase">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Date
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  Bookings
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  Tickets
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {daily.map((day) => (
                <tr key={day.date}>
                  <th scope="row" className="px-3 py-2 font-normal">
                    {formatReleaseDate(day.date)}
                  </th>
                  <td className="px-3 py-2 text-right">{day.bookings}</td>
                  <td className="px-3 py-2 text-right">{day.ticketsSold}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(day.revenue, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
