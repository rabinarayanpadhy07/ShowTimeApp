import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './index.css'
import { env } from './config/env'
import { initScrollReveal } from './lib/reveal'

initScrollReveal()

// Open the TLS connection to the API while the app is still loading (it may be another origin).
try {
  const api = new URL(env.apiBaseUrl, window.location.href)
  if (api.origin !== window.location.origin) {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = api.origin
    link.crossOrigin = 'use-credentials'
    document.head.append(link)
  }
} catch {
  // An unparsable base URL is reported by the API client itself.
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
