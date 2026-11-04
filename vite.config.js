import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * A production bundle must point at a real HTTPS API. Without this check a missing variable
 * would silently ship http://localhost:8080 to every visitor.
 */
function requireProductionApiUrl(env) {
  const url = env.VITE_API_BASE_URL
  if (!url) throw new Error('VITE_API_BASE_URL must be set for production builds (e.g. https://api.example.com/api).')
  const { protocol, hostname } = new URL(url)
  if (env.ALLOW_INSECURE_API !== 'true' && (protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(hostname))) {
    throw new Error(`VITE_API_BASE_URL must be a public https URL in production builds, got ${url}. ` +
      'Set ALLOW_INSECURE_API=true only for a local `vite build && vite preview` test.')
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
