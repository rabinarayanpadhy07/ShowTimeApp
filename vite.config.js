import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * A production bundle must point at a real HTTPS API. Without this check a missing variable
 * would silently ship http://localhost:8080 to every visitor.
 */
const DEFAULT_PROD_API_URL = 'https://showtime-backend.onrender.com/api'

function requireProductionApiUrl(env) {
  const url = env.VITE_API_BASE_URL || DEFAULT_PROD_API_URL
  try {
    const { protocol, hostname } = new URL(url)
    if (env.ALLOW_INSECURE_API !== 'true' && (protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(hostname))) {
      console.warn(`[vite] VITE_API_BASE_URL should be a public https URL in production builds, got ${url}.`)
    }
  } catch {
    console.warn(`[vite] Invalid VITE_API_BASE_URL: ${url}. Falling back to ${DEFAULT_PROD_API_URL}`)
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'production') {
    requireProductionApiUrl({ ...loadEnv(mode, process.cwd(), ''), ...process.env })
  }
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      css: false,
    },
  }
})
