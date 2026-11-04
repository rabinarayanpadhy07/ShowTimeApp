import { apiClient } from './client'

/**
 * GET /api/health. The backend answers 200 (UP) or 503 (DOWN) with the same JSON body,
 * so both are treated as a successful read of the status.
 */
export async function getHealth({ signal } = {}) {
  const response = await apiClient.get('/health', {
    signal,
    validateStatus: (status) => status === 200 || status === 503,
  })
  return response.data
}
