// Display labels for enum values returned by the API.

export const BOOKING_STATUS = {
  PENDING: { label: 'Awaiting payment', tone: 'promo' },
  CONFIRMED: { label: 'Confirmed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  EXPIRED: { label: 'Hold expired', tone: 'neutral' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
}

export const SEAT_TYPE = { STANDARD: 'Standard', PREMIUM: 'Premium', RECLINER: 'Recliner', ACCESSIBLE: 'Accessible' }

export const VENUE_TYPE = {
  CINEMA: 'Cinema',
  AUDITORIUM: 'Auditorium',
  ARENA: 'Arena',
  STADIUM: 'Stadium',
  CLUB: 'Club',
  OPEN_AIR: 'Open-air venue',
  OTHER: 'Venue',
}

export const MOVIE_SORTS = [
  { value: 'RELEASE_DATE_DESC', label: 'Newest first' },
  { value: 'RATING_DESC', label: 'Highest rated' },
  { value: 'TITLE_ASC', label: 'Title A–Z' },
  { value: 'RELEASE_DATE_ASC', label: 'Oldest first' },
]

export const EVENT_SORTS = [
  { value: 'DATE_ASC', label: 'Soonest first' },
  { value: 'PRICE_ASC', label: 'Price: low to high' },
  { value: 'PRICE_DESC', label: 'Price: high to low' },
  { value: 'TITLE_ASC', label: 'Title A–Z' },
]
