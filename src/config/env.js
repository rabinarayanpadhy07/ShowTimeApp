// Centralised access to Vite environment variables (only VITE_* are exposed).
// The localhost default only applies to `vite dev` and tests; production builds must set
// VITE_API_BASE_URL (vite.config.js refuses to build without it).
const DEV_API_BASE_URL = 'http://localhost:8080/api'
const DEFAULT_TIMEOUT_MS = 10_000

function readNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const env = Object.freeze({
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : DEV_API_BASE_URL)).replace(/\/+$/, ''),
  apiTimeoutMs: readNumber(import.meta.env.VITE_API_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
  isTest: import.meta.env.MODE === 'test',
})
