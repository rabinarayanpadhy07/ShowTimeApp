import { ProtectedRoute } from './components/account/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { RouteError } from './components/system/RouteError'
import BookingConfirmationPage from './pages/BookingConfirmationPage'
import CheckoutPage from './pages/CheckoutPage'
import EventDetailsPage from './pages/EventDetailsPage'
import EventsPage from './pages/EventsPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MovieDetailsPage from './pages/MovieDetailsPage'
import MoviesPage from './pages/MoviesPage'
import MyBookingsPage from './pages/MyBookingsPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import SearchPage from './pages/SearchPage'
import SeatSelectionPage from './pages/SeatSelectionPage'

/** Loads a page module on first visit (the admin area is not part of the customer bundle). */
const page = (load) => async () => ({ Component: (await load()).default })

/** Route table, shared by the browser router and tests (createMemoryRouter). */
export const routes = [
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'movies', element: <MoviesPage /> },
      { path: 'movies/:slug', element: <MovieDetailsPage /> },
      { path: 'shows/:id/seats', element: <SeatSelectionPage kind="movie" /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'events/:slug', element: <EventDetailsPage /> },
      { path: 'event-schedules/:id/seats', element: <SeatSelectionPage kind="event" /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'checkout/:reference', element: <CheckoutPage /> },
          { path: 'bookings/:reference/confirmation', element: <BookingConfirmationPage /> },
          { path: 'my-bookings', element: <MyBookingsPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // The admin area has its own full-screen layout, without the customer header and footer.
  {
    element: <ProtectedRoute role="ADMIN" />,
    errorElement: <RouteError />,
    children: [
      {
        path: 'admin',
        lazy: async () => ({ Component: (await import('./components/admin/AdminLayout')).AdminLayout }),
        children: [
          { index: true, lazy: page(() => import('./pages/admin/AdminDashboardPage')) },
          { path: 'movies', lazy: page(() => import('./pages/admin/AdminMoviesPage')) },
          { path: 'events', lazy: page(() => import('./pages/admin/AdminEventsPage')) },
          { path: 'schedules', lazy: page(() => import('./pages/admin/AdminSchedulesPage')) },
          { path: 'venues', lazy: page(() => import('./pages/admin/AdminVenuesPage')) },
          { path: 'venues/:id', lazy: page(() => import('./pages/admin/AdminVenueDetailPage')) },
          { path: 'bookings', lazy: page(() => import('./pages/admin/AdminBookingsPage')) },
          { path: 'payments', lazy: page(() => import('./pages/admin/AdminPaymentsPage')) },
          { path: 'users', lazy: page(() => import('./pages/admin/AdminUsersPage')) },
          { path: 'audit', lazy: page(() => import('./pages/admin/AdminAuditPage')) },
          { path: 'check-in', lazy: page(() => import('./pages/admin/AdminCheckInPage')) },
        ],
      },
    ],
  },
]
