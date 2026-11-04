/**
 * Whether the customer actually went: a confirmed booking with at least one ticket scanned at the
 * gate (status USED). While the show is still running it is "checked in"; once it has ended
 * (endsAt, or startsAt when no end time is known) it counts as watched / attended.
 * Returns null when no ticket was scanned.
 */
export function attendanceOf(booking, now = Date.now()) {
  if (booking?.status !== 'CONFIRMED') return null
  const used = (booking.tickets ?? []).filter((ticket) => ticket.status === 'USED')
  if (used.length === 0) return null
  const checkedInAt =
    used
      .map((ticket) => ticket.checkedInAt)
      .filter(Boolean)
      .sort()[0] ?? null
  const end = new Date(booking.endsAt ?? booking.startsAt).getTime()
  const over = Number.isFinite(end) && now >= end
  if (!over) return { state: 'CHECKED_IN', label: 'Checked in', checkedInAt }
  return { state: 'ATTENDED', label: booking.type === 'MOVIE' ? 'Watched' : 'Attended', checkedInAt }
}
