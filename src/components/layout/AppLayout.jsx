import { Outlet, ScrollRestoration } from 'react-router'

import { Footer } from './Footer'
import { Navbar } from './Navbar'

/** Shared page chrome for every route. */
export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}
