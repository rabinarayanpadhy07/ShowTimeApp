import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, CircleCheck, CircleX, ImageUp, Keyboard, RotateCcw, ScanLine, TriangleAlert } from 'lucide-react'

import { checkInTicket, validateTicket } from '../../api/adminApi'
import { AdminPage } from '../../components/admin/AdminUi'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Checkbox, TextField } from '../../components/ui/FormControls'
import { Card } from '../../components/ui/Section'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { cn } from '../../lib/cn'
import { formatDateTime } from '../../lib/format'
import { decodeCanvas, decodeImageFile, drawToCanvas } from '../../lib/qrDecode'

/** Every scan result says what it means in words and with an icon, never by color alone. */
const RESULTS = {
  CHECKED_IN: { title: 'Admit', icon: CircleCheck, classes: 'border-secondary bg-secondary-soft', iconClass: 'text-secondary-strong' },
  VALID: {
    title: 'Valid ticket: ready to check in',
    icon: CircleCheck,
    classes: 'border-secondary bg-secondary-soft',
    iconClass: 'text-secondary-strong',
  },
  ALREADY_USED: { title: 'Already used: do not admit', icon: TriangleAlert, classes: 'border-accent bg-accent-soft', iconClass: 'text-accent-strong' },
  OUTSIDE_WINDOW: { title: 'Not open for check-in', icon: TriangleAlert, classes: 'border-accent bg-accent-soft', iconClass: 'text-accent-strong' },
  CANCELLED: { title: 'Cancelled ticket: do not admit', icon: CircleX, classes: 'border-danger bg-danger-soft', iconClass: 'text-danger' },
  NOT_CONFIRMED: { title: 'Booking not confirmed: do not admit', icon: CircleX, classes: 'border-danger bg-danger-soft', iconClass: 'text-danger' },
  INVALID: { title: 'Invalid ticket: do not admit', icon: CircleX, classes: 'border-danger bg-danger-soft', iconClass: 'text-danger' },
}

const SCAN_INTERVAL_MS = 250
const TICKET_PREFIX = /^\s*stkt/i

function ScanResult({ scan, actions }) {
  const result = RESULTS[scan.result] ?? RESULTS.INVALID
  const Icon = result.icon
  return (
    <div role="status" aria-live="assertive" className={cn('rounded-card border-2 p-5 sm:p-6', result.classes)}>
      <p className="flex items-center gap-3 text-xl font-bold text-ink sm:text-2xl">
        <Icon aria-hidden="true" size={32} className={cn('shrink-0', result.iconClass)} />
        {result.title}
      </p>
      <p className="mt-2 text-ink-secondary">{scan.message}</p>
      {scan.ticketCode && (
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-muted">Show</dt>
            <dd className="font-semibold text-ink">{scan.title}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Starts</dt>
            <dd className="text-ink">{formatDateTime(scan.startsAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Venue</dt>
            <dd className="text-ink">
              {scan.venueName}
              {scan.screenName && ` · ${scan.screenName}`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Seat</dt>
            <dd className="text-lg font-bold text-ink">{scan.seatLabel ?? 'General admission'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Ticket · booking</dt>
            <dd className="font-mono text-xs break-all text-ink">
              {scan.ticketCode} · {scan.bookingReference}
            </dd>
          </div>
          {scan.checkedInAt && (
            <div>
              <dt className="text-xs text-ink-muted">Checked in</dt>
              <dd className="text-ink">{formatDateTime(scan.checkedInAt)}</dd>
            </div>
          )}
        </dl>
      )}
      {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

/**
 * Live camera preview that reports every QR payload it reads. Scanning pauses while `paused`
 * (e.g. while a result is on screen) so one ticket is not read twenty times.
 */
function CameraScanner({ paused, onDetected }) {
  const video = useRef(null)
  const canvas = useRef(null)
  const stream = useRef(null)
  const timer = useRef(null)
  const latest = useRef({ paused, onDetected })
  const [state, setState] = useState({ status: 'off', error: null })

  useEffect(() => {
    latest.current = { paused, onDetected }
  })

  const stop = useCallback(() => {
    clearTimeout(timer.current)
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
    setState({ status: 'off', error: null })
  }, [])

  useEffect(() => stop, [stop])

  // Reads a frame every SCAN_INTERVAL_MS while the camera is on.
  useEffect(() => {
    if (state.status !== 'on') return undefined
    let cancelled = false
    const scanFrame = async () => {
      const element = video.current
      if (cancelled || !stream.current || !element) return
      if (!latest.current.paused && element.readyState >= 2) {
        if (!canvas.current) canvas.current = document.createElement('canvas')
        const frame = drawToCanvas(element, canvas.current, 720)
        const text = frame ? await decodeCanvas(frame).catch(() => null) : null
        if (!cancelled && text && TICKET_PREFIX.test(text)) latest.current.onDetected(text)
      }
      if (!cancelled) timer.current = setTimeout(scanFrame, SCAN_INTERVAL_MS)
    }
    scanFrame()
    return () => {
      cancelled = true
      clearTimeout(timer.current)
    }
  }, [state.status])

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({
        status: 'error',
        error: 'This browser cannot open the camera here (it needs HTTPS or localhost). Upload a photo of the QR code instead.',
      })
      return
    }
    setState({ status: 'starting', error: null })
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      video.current.srcObject = stream.current
      await video.current.play()
      setState({ status: 'on', error: null })
    } catch (error) {
      stop()
      setState({
        status: 'error',
        error:
          error?.name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow the camera for this site in the browser settings, or upload a photo instead.'
            : 'No camera could be opened on this device. Upload a photo of the QR code instead.',
      })
    }
  }

  const on = state.status === 'on'
  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ink sm:aspect-video">
        <video ref={video} muted playsInline aria-label="Camera preview" className={cn('size-full object-cover', !on && 'invisible')} />
        {on && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative size-48 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgb(0_0_0/0.35)] sm:size-56">
              {!paused && <div className="absolute inset-x-3 top-1/2 h-0.5 animate-pulse bg-primary" />}
            </div>
          </div>
        )}
        {!on && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white/80">
            <ScanLine aria-hidden="true" size={40} />
            <p className="text-sm">{state.status === 'starting' ? 'Opening the camera…' : 'Start the camera and hold the ticket QR inside the frame.'}</p>
          </div>
        )}
        {on && paused && (
          <p className="absolute inset-x-0 bottom-3 text-center text-xs font-semibold text-white drop-shadow">Paused: finish this ticket, then scan the next</p>
        )}
      </div>
      {state.error && <Alert tone="warning">{state.error}</Alert>}
      <div className="flex flex-wrap gap-2">
        {on ? (
          <Button variant="outline" leftIcon={CameraOff} onClick={stop}>
            Stop camera
          </Button>
        ) : (
          <Button leftIcon={Camera} loading={state.status === 'starting'} onClick={start}>
            Start camera
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Gate check-in. Scan with the device camera, upload a photo of the QR, or type/paste the code
 * (handheld scanners type it and press Enter). A scanned ticket is validated first and checked in
 * with one click, or immediately when "Check in automatically" is on. The customer's booking then
 * shows "Checked in", and "Watched"/"Attended" once the show is over.
 */
export default function AdminCheckInPage() {
  useDocumentTitle('Ticket check-in · Admin')
  const input = useRef(null)
  const fileInput = useRef(null)
  const lastScan = useRef({ payload: null, at: 0 })
  const [payload, setPayload] = useState('')
  const [autoCheckIn, setAutoCheckIn] = useState(false)
  const [state, setState] = useState({ busy: false, scan: null, payload: null, error: null })
  const [history, setHistory] = useState([])

  const record = (scan) => {
    if (scan?.result === 'CHECKED_IN') setHistory((items) => [{ ...scan, at: new Date().toISOString() }, ...items].slice(0, 50))
  }

  const run = async (action, value) => {
    const code = value.trim()
    if (!code) return
    // Handheld scanners type into the field: keep it focused for the next ticket.
    const refocus = document.activeElement === input.current
    setState({ busy: true, scan: null, payload: code, error: null })
    try {
      const scan = await action(code)
      setState({ busy: false, scan, payload: code, error: null })
      record(scan)
      setPayload('')
    } catch (error) {
      setState({ busy: false, scan: null, payload: code, error })
    } finally {
      if (refocus) input.current?.focus()
    }
  }

  const onDetected = (text) => {
    // Ignore the same code read again within a few seconds.
    const now = Date.now()
    if (state.busy || state.scan || (lastScan.current.payload === text && now - lastScan.current.at < 4000)) return
    lastScan.current = { payload: text, at: now }
    navigator.vibrate?.(60)
    run(autoCheckIn ? checkInTicket : validateTicket, text)
  }

  const onFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setState({ busy: true, scan: null, payload: null, error: null })
    const text = await decodeImageFile(file).catch(() => null)
    if (!text) {
      setState({ busy: false, scan: null, payload: null, error: new Error('No QR code was found in that image. Try a sharper, closer photo.') })
      return
    }
    run(autoCheckIn ? checkInTicket : validateTicket, text)
  }

  const next = () => {
    setState({ busy: false, scan: null, payload: null, error: null })
    input.current?.focus()
  }

  const showResult = state.scan || state.error
  const canCheckIn = state.scan?.result === 'VALID' && state.payload

  return (
    <AdminPage
      title="Ticket check-in"
      description="Scan a ticket's QR code with the camera, upload a photo of it, or type the code. Each ticket can be checked in once."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Card className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <ScanLine aria-hidden="true" size={20} />
              Scanner
            </h2>
            <CameraScanner paused={Boolean(showResult) || state.busy} onDetected={onDetected} />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4">
              <Button variant="outline" leftIcon={ImageUp} onClick={() => fileInput.current?.click()} disabled={state.busy}>
                Upload QR photo
              </Button>
              <input ref={fileInput} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={onFile} aria-label="Ticket photo" />
              <Checkbox
                label="Check in automatically"
                description="Skip the confirmation click after each scan."
                checked={autoCheckIn}
                onChange={(event) => setAutoCheckIn(event.target.checked)}
              />
            </div>
          </Card>

          {state.busy && !showResult && (
            <p role="status" className="text-sm text-ink-secondary">
              Checking the ticket…
            </p>
          )}
          {state.error && (
            <Alert tone="error" title="Could not check this ticket">
              {state.error.message}
            </Alert>
          )}
          {state.scan && (
            <ScanResult
              scan={state.scan}
              actions={
                <>
                  {canCheckIn && (
                    <Button size="lg" leftIcon={CircleCheck} loading={state.busy} onClick={() => run(checkInTicket, state.payload)}>
                      Check in
                    </Button>
                  )}
                  <Button size="lg" variant={canCheckIn ? 'outline' : 'primary'} leftIcon={RotateCcw} onClick={next}>
                    Scan next
                  </Button>
                </>
              }
            />
          )}
          {state.error && (
            <Button variant="outline" leftIcon={RotateCcw} onClick={next}>
              Scan next
            </Button>
          )}

          <Card>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                run(checkInTicket, payload)
              }}
              className="space-y-4"
            >
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <Keyboard aria-hidden="true" size={18} />
                Type the ticket code
              </h2>
              <TextField
                ref={input}
                label="QR or ticket code"
                icon={ScanLine}
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                placeholder="STKT1.… or 3ASYVRPS…"
                autoComplete="off"
                hint="The QR text (starting with STKT1) or the ticket code printed on the ticket. Handheld scanners can type it here and press Enter."
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={state.busy && Boolean(payload)} disabled={!payload.trim()}>
                  Check in
                </Button>
                <Button variant="outline" disabled={!payload.trim() || state.busy} onClick={() => run(validateTicket, payload)}>
                  Validate only
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <aside aria-labelledby="history-heading" className="lg:sticky lg:top-6 lg:h-fit">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 id="history-heading" className="text-base font-semibold text-ink">
                Checked in here
              </h2>
              <Badge tone="success">{history.length}</Badge>
            </div>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Tickets you check in on this device appear here.</p>
            ) : (
              <ul className="mt-3 max-h-[28rem] divide-y divide-line overflow-y-auto text-sm">
                {history.map((item) => (
                  <li key={`${item.ticketCode}-${item.at}`} className="py-2.5">
                    <p className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-ink">{item.title}</span>
                      <span className="shrink-0 font-semibold text-ink">{item.seatLabel ?? 'GA'}</span>
                    </p>
                    <p className="text-xs text-ink-muted">
                      {item.bookingReference} · {formatDateTime(item.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <p className="mt-3 text-xs text-ink-muted">
            Check-in opens 6 hours before the start and closes 4 hours after it. Every check-in is recorded in the audit log under your account.
          </p>
        </aside>
      </div>
    </AdminPage>
  )
}
