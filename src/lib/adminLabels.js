// Enum values accepted by the admin API, with display labels. `options()` turns a map into
// SelectField options.

export const options = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }))

export const MOVIE_STATUS = { COMING_SOON: 'Coming soon', NOW_SHOWING: 'Now showing', ARCHIVED: 'Archived' }
export const EVENT_STATUS = { DRAFT: 'Draft', PUBLISHED: 'Published', CANCELLED: 'Cancelled', COMPLETED: 'Completed' }
export const EVENT_CATEGORY = {
  CONCERT: 'Concerts',
  COMEDY: 'Comedy',
  THEATRE: 'Theatre',
  SPORTS: 'Sports',
  WORKSHOP: 'Workshops',
  FESTIVAL: 'Festivals',
  KIDS: 'Kids',
  OTHER: 'Other',
}
export const SHOW_FORMAT = { TWO_D: '2D', THREE_D: '3D', IMAX_2D: 'IMAX 2D', IMAX_3D: 'IMAX 3D', FOUR_DX: '4DX' }
export const SCREEN_TYPE = { STANDARD: 'Standard', IMAX: 'IMAX', DOLBY: 'Dolby', FOUR_DX: '4DX', HALL: 'Hall', STAGE: 'Stage' }
export const SEATING_TYPE = { RESERVED: 'Reserved seating', GENERAL_ADMISSION: 'General admission' }
export const SCHEDULE_STATUS = { SCHEDULED: 'Scheduled', CANCELLED: 'Cancelled', COMPLETED: 'Completed' }
export const BOOKING_STATUS_LABEL = {
  PENDING: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Hold expired',
  REFUNDED: 'Refunded',
}
export const BOOKING_TYPE = { MOVIE: 'Movie', EVENT: 'Event' }
export const USER_ROLE = { USER: 'Customer', ADMIN: 'Administrator' }
export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  AUTHORIZED: 'Authorized',
  SUCCEEDED: 'Succeeded',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partially refunded',
}
export const REFUND_STATUS = { PENDING: 'Pending', PROCESSED: 'Processed', FAILED: 'Failed' }
export const REFUND_REASON = {
  CUSTOMER_CANCELLED: 'Customer cancelled',
  LATE_PAYMENT: 'Paid after hold ended',
  DUPLICATE_PAYMENT: 'Duplicate payment',
  AMOUNT_MISMATCH: 'Amount mismatch',
  SHOW_CANCELLED: 'Show cancelled',
}

/** Badge tones for statuses across the admin area. */
export const STATUS_TONE = {
  NOW_SHOWING: 'success',
  CONFIRMED: 'success',
  ADMIN: 'dark',
  COMING_SOON: 'promo',
  PUBLISHED: 'success',
  DRAFT: 'promo',
  SCHEDULED: 'success',
  SUCCEEDED: 'success',
  PROCESSED: 'success',
  PENDING: 'promo',
  AUTHORIZED: 'promo',
  FAILED: 'primary',
}
