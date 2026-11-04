import { Logo } from '../layout/Logo'

/** Centered card used by the login and registration pages. */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="bg-surface-subtle py-12 sm:py-16">
      <div className="container-page">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo className="mb-6" />
            <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-ink-secondary">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-ink-secondary">{footer}</div>}
      </div>
    </div>
  )
}
