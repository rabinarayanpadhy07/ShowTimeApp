import { formatCurrency, formatDateTime, pluralize } from './format'

/*
 * Draws a booking's tickets (with their signed QR codes) into a PNG, so customers can keep them
 * in their photos and show them at the entrance offline. Everything is drawn locally from data the
 * page already has; nothing is uploaded.
 */

const WIDTH = 1080
const PAD = 72
const FONT = "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace"
const COLORS = {
  page: '#f2f2f2',
  card: '#ffffff',
  brand: '#ff5a5f',
  ink: '#222222',
  inkSecondary: '#484848',
  muted: '#717171',
  line: '#dddddd',
  success: '#00756c',
}
const TICKET_STATUS = { VALID: 'Valid', USED: 'Checked in', CANCELLED: 'Cancelled' }

const HEADER_H = 150
const QR_SIZE = 380
const TICKET_H = QR_SIZE + 2 * 56

function wrapLines(ctx, text, maxWidth, maxLines) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    let last = kept[maxLines - 1]
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    kept[maxLines - 1] = `${last}…`
    return kept
  }
  return lines
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Loads the server's QR SVG as an image at a fixed size (some browsers need explicit dimensions). */
async function loadQr(svg) {
  if (!svg) return null
  try {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
    const root = doc.documentElement
    if (root.nodeName.toLowerCase() !== 'svg') return null
    root.setAttribute('width', String(QR_SIZE))
    root.setAttribute('height', String(QR_SIZE))
    const markup = new XMLSerializer().serializeToString(root)
    const image = new Image()
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
    await image.decode()
    return image
  } catch {
    return null
  }
}

function venueLine(booking) {
  const venue = booking.venue ?? {}
  return [venue.name, booking.screenName, venue.city].filter(Boolean).join(' · ')
}

/** Renders the booking and its tickets; resolves to a PNG Blob. */
export async function renderTicketsImage(booking, tickets) {
  // Canvas text only uses Inter if each weight is already loaded, so request them explicitly.
  await Promise.all(['500', '600', '700', '800'].map((weight) => document.fonts?.load(`${weight} 30px Inter`))).catch(() => {})
  const qrImages = await Promise.all(tickets.map((ticket) => loadQr(ticket.qrSvg)))

  const measure = document.createElement('canvas').getContext('2d')
  const contentWidth = WIDTH - 2 * PAD - 2 * 48
  measure.font = `800 60px ${FONT}`
  const titleLines = wrapLines(measure, booking.title, contentWidth, 3)
  measure.font = `500 30px ${FONT}`
  const rows = [
    ['When', formatDateTime(booking.startsAt, booking.venue?.timeZone)],
    ['Where', venueLine(booking)],
    ['Booking', `${booking.reference}  ·  ${formatCurrency(booking.total, booking.currency)} paid`],
  ].map(([label, value]) => [label, wrapLines(measure, value, contentWidth - 170, 2)])
  const rowsH = rows.reduce((sum, [, lines]) => sum + 52 + (lines.length - 1) * 40, 0)
  const detailsH = 48 + titleLines.length * 72 + (booking.subtitle ? 48 : 0) + rowsH + 40
  const footerH = 170
  const height = PAD + HEADER_H + detailsH + tickets.length * TICKET_H + footerH + PAD

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = COLORS.page
  ctx.fillRect(0, 0, WIDTH, height)

  const cardX = PAD
  const cardW = WIDTH - 2 * PAD
  const cardH = height - 2 * PAD
  const innerX = cardX + 48

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.12)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 12
  roundedRect(ctx, cardX, PAD, cardW, cardH, 36)
  ctx.fillStyle = COLORS.card
  ctx.fill()
  ctx.restore()

  // Brand header.
  ctx.save()
  roundedRect(ctx, cardX, PAD, cardW, cardH, 36)
  ctx.clip()
  ctx.fillStyle = COLORS.brand
  ctx.fillRect(cardX, PAD, cardW, HEADER_H)
  ctx.restore()
  ctx.fillStyle = COLORS.ink
  ctx.font = `800 52px ${FONT}`
  ctx.fillText('ShowTime', innerX, PAD + 94)
  ctx.font = `700 26px ${FONT}`
  ctx.textAlign = 'right'
  ctx.fillText(`E-TICKET · ${pluralize(tickets.length, 'ticket').toUpperCase()}`, cardX + cardW - 48, PAD + 90)
  ctx.textAlign = 'left'

  // Booking details.
  let y = PAD + HEADER_H + 48
  ctx.fillStyle = COLORS.ink
  ctx.font = `800 60px ${FONT}`
  for (const line of titleLines) {
    y += 66
    ctx.fillText(line, innerX, y)
  }
  y += 6
  if (booking.subtitle) {
    y += 44
    ctx.fillStyle = COLORS.muted
    ctx.font = `500 30px ${FONT}`
    ctx.fillText(wrapLines(ctx, booking.subtitle, contentWidth, 1)[0], innerX, y)
  }
  for (const [label, lines] of rows) {
    y += 52
    ctx.fillStyle = COLORS.muted
    ctx.font = `600 24px ${FONT}`
    ctx.fillText(label.toUpperCase(), innerX, y)
    ctx.fillStyle = COLORS.inkSecondary
    ctx.font = `500 30px ${FONT}`
    lines.forEach((line, index) => {
      if (index > 0) y += 40
      ctx.fillText(line, innerX + 170, y)
    })
  }
  y = PAD + HEADER_H + detailsH

  // Tickets, each separated by a perforation with notches cut into the card edges.
  tickets.forEach((ticket, index) => {
    ctx.save()
    ctx.strokeStyle = COLORS.line
    ctx.lineWidth = 3
    ctx.setLineDash([14, 12])
    ctx.beginPath()
    ctx.moveTo(cardX + 40, y)
    ctx.lineTo(cardX + cardW - 40, y)
    ctx.stroke()
    ctx.restore()
    ctx.fillStyle = COLORS.page
    for (const x of [cardX, cardX + cardW]) {
      ctx.beginPath()
      ctx.arc(x, y, 26, 0, Math.PI * 2)
      ctx.fill()
    }

    const top = y + 56
    const qr = qrImages[index]
    ctx.fillStyle = '#ffffff'
    roundedRect(ctx, innerX, top, QR_SIZE, QR_SIZE, 20)
    ctx.fill()
    ctx.strokeStyle = COLORS.line
    ctx.lineWidth = 2
    ctx.stroke()
    if (qr) {
      ctx.drawImage(qr, innerX + 16, top + 16, QR_SIZE - 32, QR_SIZE - 32)
    } else {
      ctx.fillStyle = COLORS.muted
      ctx.font = `500 26px ${FONT}`
      ctx.textAlign = 'center'
      ctx.fillText('QR unavailable', innerX + QR_SIZE / 2, top + QR_SIZE / 2)
      ctx.textAlign = 'left'
    }

    const textX = innerX + QR_SIZE + 48
    const textW = cardX + cardW - 48 - textX
    ctx.fillStyle = COLORS.muted
    ctx.font = `600 24px ${FONT}`
    ctx.fillText(`TICKET ${index + 1} OF ${tickets.length}`, textX, top + 60)
    ctx.fillStyle = COLORS.ink
    ctx.font = `800 48px ${FONT}`
    ctx.fillText(ticket.seatLabel ? `Seat ${ticket.seatLabel}` : 'General', textX, top + 124)
    if (!ticket.seatLabel) ctx.fillText('admission', textX, top + 180)
    ctx.fillStyle = COLORS.inkSecondary
    ctx.font = `600 28px ${MONO}`
    ctx.fillText(wrapLines(ctx, ticket.code, textW, 1)[0], textX, top + 250)
    const valid = ticket.status === 'VALID'
    ctx.fillStyle = valid ? COLORS.success : COLORS.muted
    ctx.font = `700 28px ${FONT}`
    ctx.fillText(TICKET_STATUS[ticket.status] ?? ticket.status ?? '', textX, top + 310)

    y += TICKET_H
  })

  // Footer note.
  ctx.save()
  ctx.strokeStyle = COLORS.line
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(innerX, y)
  ctx.lineTo(cardX + cardW - 48, y)
  ctx.stroke()
  ctx.restore()
  ctx.fillStyle = COLORS.muted
  ctx.font = `500 26px ${FONT}`
  ctx.fillText('Show the QR code at the entrance. Each code admits one person.', innerX, y + 64)
  ctx.fillText('Keep this image private: anyone with the code can use the ticket.', innerX, y + 106)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the ticket image.'))), 'image/png')
  })
}

/**
 * Saves the image. On phones the share sheet is used, whose "Save image" option puts it in the
 * photo gallery; elsewhere (or if sharing is unavailable) it is downloaded as a PNG file.
 */
export async function saveImage(blob, filename) {
  const file = typeof File === 'function' ? new File([blob], filename, { type: blob.type }) : null
  const touch = window.matchMedia?.('(pointer: coarse)').matches
  if (touch && file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return 'shared'
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'
      // Sharing can be refused (e.g. the click is too old); fall back to a download.
    }
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
