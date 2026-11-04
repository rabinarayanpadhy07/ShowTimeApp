import { LoaderCircle } from 'lucide-react'
import { Link } from 'react-router'

import { cn } from '../../lib/cn'
import { buttonClasses } from './buttonClasses'

/**
 * Button with brand variants. Pass `to` to render a router Link styled as a button.
 * `loading` disables the button and shows a spinner while keeping its label for screen readers.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  to,
  className,
  children,
  type = 'button',
  disabled,
  ...props
}) {
  const classes = buttonClasses({ variant, size, fullWidth, className })
  const iconSize = size === 'sm' ? 16 : 18
  const content = (
    <>
      {loading ? (
        <LoaderCircle aria-hidden="true" size={iconSize} className="animate-spin" />
      ) : (
        LeftIcon && <LeftIcon aria-hidden="true" size={iconSize} />
      )}
      <span>{children}</span>
      {RightIcon && !loading && <RightIcon aria-hidden="true" size={iconSize} />}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  )
}

export function IconButton({ label, icon: Icon, className, size = 20, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-subtle',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" size={size} />
    </button>
  )
}
