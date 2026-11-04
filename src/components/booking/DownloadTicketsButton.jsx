import { useState } from 'react'
import { Download } from 'lucide-react'

import { getTickets } from '../../api/bookingApi'
import { renderTicketsImage, saveImage } from '../../lib/ticketImage'
import { Button } from '../ui/Button'

/**
 * Saves a confirmed booking's tickets (with QR codes) as a PNG image. Uses `tickets` when the page
 * already has them, otherwise fetches them first.
 */
export function DownloadTicketsButton({ booking, tickets, label = 'Download tickets', ...buttonProps }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const download = async () => {
    setBusy(true)
    setError(null)
    try {
      const list = tickets?.some((ticket) => ticket.qrSvg) ? tickets : await getTickets(booking.reference)
      if (!list?.length) throw new Error('This booking has no tickets to download.')
      const blob = await renderTicketsImage(booking, list)
      await saveImage(blob, `ShowTime-${booking.reference}.png`)
    } catch (err) {
      setError(err?.message ? err : new Error('The ticket image could not be created. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button leftIcon={Download} loading={busy} onClick={download} {...buttonProps}>
        {label}
      </Button>
      {error && (
        <span role="alert" className="text-xs font-medium text-danger">
          {error.message}
        </span>
      )}
    </span>
  )
}
