import { apiClient } from './client'

// Public catalog endpoints. Page numbers are 0-based on the API.

function clean(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

export async function listMovies(params = {}) {
  return (await apiClient.get('/movies', { params: clean(params) })).data
}

export async function getMovie(slug) {
  return (await apiClient.get(`/movies/${encodeURIComponent(slug)}`)).data
}

export async function getMovieShowtimes(slug, { date, city } = {}) {
  return (await apiClient.get(`/movies/${encodeURIComponent(slug)}/showtimes`, { params: clean({ date, city }) })).data
}

export async function listMovieLanguages() {
  return (await apiClient.get('/movies/languages')).data
}

export async function listGenres() {
  return (await apiClient.get('/genres')).data
}

export async function listEvents(params = {}) {
  return (await apiClient.get('/events', { params: clean(params) })).data
}

export async function getEvent(slug) {
  return (await apiClient.get(`/events/${encodeURIComponent(slug)}`)).data
}

export async function listEventCategories() {
  return (await apiClient.get('/events/categories')).data
}

export async function listVenues(city) {
  return (await apiClient.get('/venues', { params: clean({ city }) })).data
}

export async function listCities() {
  return (await apiClient.get('/venues/cities')).data
}

export async function search(q) {
  return (await apiClient.get('/search', { params: { q } })).data
}
