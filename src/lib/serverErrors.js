/** Maps an ApiError's fieldErrors ([{ field, message }]) to { field: message } for forms. */
export function serverFieldErrors(error) {
  const errors = {}
  for (const { field, message } of error?.fieldErrors ?? []) {
    if (field && !errors[field]) errors[field] = message.charAt(0).toUpperCase() + message.slice(1)
  }
  return errors
}

/** A friendly sign-in error, including how long to wait after too many attempts. */
export function authErrorMessage(error) {
  if (error?.code === 'RATE_LIMITED') {
    const minutes = error.retryAfter ? Math.ceil(error.retryAfter / 60) : null
    return minutes
      ? `Too many failed attempts. Please wait ${minutes} minute${minutes === 1 ? '' : 's'} and try again.`
      : 'Too many failed attempts. Please wait a few minutes and try again.'
  }
  return error?.message ?? 'Something went wrong. Please try again.'
}

/** Only same-app paths are allowed as post-login redirect targets (no open redirects). */
export function safeRedirect(from) {
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/'
}
