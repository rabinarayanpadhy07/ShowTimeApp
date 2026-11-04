import { isRouteErrorResponse, useRouteError } from 'react-router'

import { Button } from '../ui/Button'
import { ErrorState } from '../ui/States'

/** Router error boundary: shown when a route throws while rendering. */
export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'An unexpected error occurred while loading this page.'
  return <ErrorState title="This page failed to load" message={message} action={<Button to="/">Back to home</Button>} className="py-24" />
}
