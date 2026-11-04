import { render } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { AuthProvider } from '../context/AuthContext'
import { routes } from '../routes'

/** Renders the real route table at `path` (optionally with navigation state). */
export function renderRoute(path, { state } = {}) {
  const [pathname, search = ''] = path.split('?')
  const router = createMemoryRouter(routes, { initialEntries: [{ pathname, search: search ? `?${search}` : '', state }] })
  const utils = render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
  return { router, ...utils }
}
