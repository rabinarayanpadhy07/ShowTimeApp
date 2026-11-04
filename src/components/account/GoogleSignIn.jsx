import { useEffect, useRef, useState } from 'react'

import { getAuthConfig } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import { authErrorMessage } from '../../lib/serverErrors'
import { Alert } from '../ui/Alert'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
let gisLoading = null

/** Loads Google Identity Services once. */
function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)
  if (!gisLoading) {
    gisLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = GIS_SRC
      script.async = true
      script.defer = true
      script.onload = () => (window.google?.accounts?.id ? resolve(window.google) : reject(new Error('Google sign-in did not load.')))
      script.onerror = () => {
        gisLoading = null
        script.remove()
        reject(new Error('Could not reach Google. Check your connection and try again.'))
      }
      document.head.appendChild(script)
    })
  }
  return gisLoading
}

/**
 * "Continue with Google". Renders Google's own button (so Google handles the account picker and
 * consent), then sends the returned ID token to the server, which verifies it before signing in.
 * Renders nothing when the server has no Google client ID configured.
 */
export function GoogleSignIn({ onSignedIn, text = 'continue_with' }) {
  const { loginWithGoogle } = useAuth()
  const container = useRef(null)
  const [clientId, setClientId] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  // Google draws its button in an iframe; it stays 0px tall if Google refuses (e.g. origin not allowed).
  const [rendered, setRendered] = useState(false)
  // Kept in a ref so Google's callback always sees the latest handlers.
  const handlers = useRef({ loginWithGoogle, onSignedIn })
  useEffect(() => {
    handlers.current = { loginWithGoogle, onSignedIn }
  })

  useEffect(() => {
    let active = true
    Promise.resolve(getAuthConfig())
      .then((config) => active && setClientId(config?.googleClientId || null))
      .catch(() => active && setClientId(null))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!clientId || !container.current) return undefined
    let cancelled = false
    loadGoogleIdentity()
      .then((google) => {
        if (cancelled || !container.current) return
        google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: async ({ credential }) => {
            setError(null)
            setBusy(true)
            try {
              const user = await handlers.current.loginWithGoogle(credential)
              handlers.current.onSignedIn?.(user)
            } catch (err) {
              setError(err)
              setBusy(false)
            }
          },
        })
        const width = Math.min(400, Math.max(200, container.current.offsetWidth))
        google.accounts.id.renderButton(container.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          logo_alignment: 'center',
          width,
        })
      })
      .catch((err) => !cancelled && setError(err))
    return () => {
      cancelled = true
    }
  }, [clientId, text])

  useEffect(() => {
    const element = container.current
    if (!clientId || !element || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => setRendered(element.offsetHeight > 10))
    observer.observe(element)
    return () => observer.disconnect()
  }, [clientId])

  if (!clientId) return null

  return (
    <div className={rendered || error ? 'space-y-4' : undefined}>
      <div ref={container} aria-busy={busy || undefined} className="flex w-full justify-center" />
      {error && (
        <Alert tone="error" title="Google sign-in failed">
          {authErrorMessage(error)}
        </Alert>
      )}
      <div className={rendered ? 'flex items-center gap-3 text-xs font-medium tracking-wide text-ink-muted uppercase' : 'hidden'}>
        <span className="h-px flex-1 bg-line" />
        or use your email
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  )
}
