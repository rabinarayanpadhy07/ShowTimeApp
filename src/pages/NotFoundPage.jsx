import { Home, SearchX } from 'lucide-react'

import { Button } from '../components/ui/Button'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="container-page flex flex-col items-center py-24 text-center sm:py-32">
      <span className="mb-6 inline-flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
        <SearchX aria-hidden="true" size={30} />
      </span>
      <p className="text-sm font-semibold tracking-wide text-primary-strong uppercase">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">This page has left the building</h1>
      <p className="mt-3 max-w-md text-base text-ink-secondary">
        The page you're looking for doesn't exist or may have moved. Let's get you back to the show.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/" leftIcon={Home}>
          Back to home
        </Button>
        <Button to="/movies" variant="outline">
          Browse movies
        </Button>
      </div>
    </div>
  )
}
