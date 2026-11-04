# ShowTime-Frontend

Web client for **ShowTime**, a movie and live-event booking platform. It is one of two independent
projects; the API is [ShowTime-Backend](../ShowTime-Backend).

**Stack:** React 19 · Vite 8 · JavaScript · Tailwind CSS 4 · React Router 8 · Axios · Lucide React ·
Vitest + React Testing Library.

## Requirements

* Node.js **22.22+** (React Router 8 requirement) and npm
* A running ShowTime-Backend (default `http://localhost:8080`)

## Setup

```bash
npm install
cp .env.example .env.local   # optional; defaults work for local development
npm run dev                  # http://localhost:5173
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` in development only; **required** for `npm run build` | Backend base URL (no trailing slash) |
| `VITE_API_TIMEOUT_MS` | `10000` | Request timeout |

Only `VITE_*` variables reach the browser, so never put secrets in them. The backend must list this
app's origin in `CORS_ALLOWED_ORIGINS` (default `http://localhost:5173`).

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build into `dist/` (needs `VITE_API_BASE_URL`, see Deployment) |
| `npm run preview` | Serve the production build |
| `npm test` | Run the test suite once (Vitest + RTL, jsdom) |
| `npm run lint` | Oxlint |

## How it talks to the backend

* `src/api/client.js`: one Axios instance. It attaches the in-memory access token, sends
  `X-Requested-With` and cookies (for the HttpOnly refresh cookie), normalizes errors into `ApiError`,
  and on a `401` performs **one** shared refresh and retries the request.
* `src/api/*Api.js`: one module per area (catalog, auth, booking, admin, health). Pages call these;
  no page builds URLs itself.
* `src/context/AuthContext.jsx`: restores the session on load, and handles login, register, logout
  and session expiry.
* Prices, fees, totals, seat availability and booking status always come from the server. The UI
  never computes or fakes them.

## Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home: search, top-rated movie, trending, categories, events, venues | public |
| `/movies`, `/movies/:slug` | List (search, genre, language, rating, sort, pages), details + showtimes | public |
| `/events`, `/events/:slug` | List (search, category, city, dates, price, sort, pages), details + dates | public |
| `/search?q=` | Movies, events and venues | public |
| `/shows/:id/seats`, `/event-schedules/:id/seats` | Live seat map with server quote | public; holding seats needs sign-in |
| `/checkout/:reference` | Hold countdown, server totals, provider checkout (Razorpay or sandbox) | signed in |
| `/bookings/:reference/confirmation` | Tickets with signed QR codes (only once CONFIRMED) | signed in |
| `/my-bookings`, `/profile` | Bookings with refund preview before cancelling, refund status; profile + password change | signed in |
| `/admin` | Health, live counts, sales metrics with a daily revenue chart | ADMIN (enforced by the API) |
| `/admin/movies`, `/admin/events` | Catalog: search, create/edit, publish/archive, add shows and event dates | ADMIN |
| `/admin/schedules` | Movie shows and event dates: occupancy, edit, cancel (with explicit refund consent) | ADMIN |
| `/admin/venues`, `/admin/venues/:id` | Venues, screens/halls and a row-based seat-map editor | ADMIN |
| `/admin/bookings`, `/admin/payments` | Booking search and detail; payment attempts (reconcile now) and refunds (retry) | ADMIN |
| `/admin/users`, `/admin/audit` | Roles and account status (never your own); searchable audit log | ADMIN |
| `/admin/check-in` | Gate scanning: check in or validate a ticket QR (keyboard-wedge scanners work) | ADMIN |
| `/login`, `/register` | Auth forms with validation | public |

## Design system

Tokens live in `src/index.css` (`@theme`): coral `#FF5A5F` for primary actions, teal `#00A699` for
success and availability, orange `#FC642D` sparingly for promotions, neutrals for surfaces.
Contrast: labels on coral and teal use `#222222` (white on coral is only 3:1); coral and teal
*text* uses the darker `primary-strong` / `secondary-strong` tokens. Every interactive element
has a visible `:focus-visible` outline, and reduced-motion is respected.

## Admin area

The admin pages are code-split (`lazy` routes), so customers never download them. Times are
entered in the **venue's** time zone (`src/lib/zonedTime.js`), whatever the browser's zone is;
lists show times in India time. Every form shows the server's validation messages next to the
fields and its conflict messages (overlapping shows, booked seats, last administrator, …) above
the buttons; the UI never pre-empts a server rule it cannot see.

## Payments

The browser never decides that a payment succeeded and never sends an amount:

1. `POST /api/bookings/{ref}/payments` creates (or reuses) a provider order for the server's total.
2. The customer pays in the provider's checkout: Razorpay Standard Checkout (`checkout.js`, loaded
   on demand from `checkout.razorpay.com` by `src/lib/razorpay.js`), or the sandbox's simulated checkout.
3. The signed result goes to `POST /api/payments/{id}/confirm`. The server verifies the signature
   and asks the provider before confirming. If confirmation is delayed, checkout polls
   `GET /api/payments/{id}` for about a minute, then tells the customer it will finish automatically.

Backend `PAYMENTS_PROVIDER` decides what checkout shows:

* `sandbox`: a **Test mode** banner and two test outcomes (approve / decline). No money moves.
* `razorpay` with `rzp_test_` keys: a **Test mode** banner; use Razorpay's test cards and UPI IDs.
* `none`: checkout explains that payments are unavailable and nothing is confirmed.

The Content-Security-Policy in `vercel.json` already allows `https://checkout.razorpay.com`
(`script-src`, `frame-src`) and `https://api.razorpay.com` (`frame-src`, `form-action`). Keep
those if you change it.

## Deployment (Vercel)

1. Import the repository into Vercel; `vercel.json` sets the Vite build, `dist/` output, the SPA
   rewrite (deep links such as `/movies/<slug>` survive a reload) and long caching for `assets/`.
2. Set **`VITE_API_BASE_URL`** for Production (and Preview), e.g. `https://api.showtime.example/api`.
   The value is baked into the bundle at build time, so changing it needs a redeploy.
3. Add the site's exact origin to the backend's `CORS_ALLOWED_ORIGINS`. Serve the API from a
   subdomain of the same domain (`api.showtime.example`) so the refresh cookie is first-party.
   On `*.vercel.app` + `*.onrender.com`, Safari drops it (backend `docs/DEPLOYMENT.md`).

Safety checks:

* `npm run build` **fails** when `VITE_API_BASE_URL` is missing, not `https`, or points at
  `localhost`/`127.0.0.1`. The production code has no localhost fallback. Use
  `ALLOW_INSECURE_API=true` only for a local `vite build && vite preview` test.
* `vercel.json` adds HSTS, `nosniff`, a strict referrer policy, a Permissions-Policy, and a CSP
  with `frame-ancestors 'none'`. The CSP has **not** been tried on a live Vercel deployment yet:
  after the first deploy, open checkout and confirm the console shows no CSP violations.
* The bundle contains only `VITE_*` values; database credentials and API secrets live only in the backend.

Vercel's Hobby plan is for non-commercial use only. A site that sells tickets needs Pro (prices
and sources in the backend's `docs/DEPLOYMENT.md`). Roll back with Deployments → previous
deployment → **Promote to Production**.

## Test results (2026-10-26)

* `npm test`: 73 tests in 8 files, all passing. `npm run lint`: clean. `npm run build` with an
  https API URL: main bundle 389 kB (119 kB gzipped), admin pages in separate lazy chunks.
* Browser run (Playwright, Microsoft Edge) against the real backend: 138 of 138 checks passed.
  It covered public pages at 375, 768 and 1280 px and admin pages at phone and desktop width,
  with no horizontal page scroll and no console errors. It also ran the full purchase,
  cancellation and refund flow and the protected-route redirects.
* Coverage, gaps and the manual end-to-end checklist: backend `docs/TESTING.md`.

Known UI limitation: on a phone, the seat map scrolls sideways for wide halls, and the "screen"
marker is centred on the full grid, so it can start partly off-screen.

## Structure

```
src/
├── api/          Axios client, session token store, per-area API modules
├── components/   ui/ (primitives), layout/, catalog/, booking/, account/, system/, admin/
├── context/      AuthContext
├── hooks/        useAsync, useHoldInventory, useBackendHealth, useDocumentTitle
├── lib/          formatting, labels, validation, palette, server-error helpers
├── pages/        one file per route (admin/ for the admin area)
└── test/         setup, fixtures, renderRoute helper
```
