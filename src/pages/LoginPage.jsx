import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { AuthLayout } from '../components/account/AuthLayout'
import { GoogleSignIn } from '../components/account/GoogleSignIn'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/FormControls'
import { PasswordField } from '../components/ui/PasswordField'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { authErrorMessage, safeRedirect } from '../lib/serverErrors'
import { rules, validate } from '../lib/validation'

const SCHEMA = {
  email: [rules.required('Email'), rules.email()],
  password: [rules.required('Password')],
}

const REASONS = {
  expired: 'Your session has expired. Please sign in again.',
  required: 'Please sign in to continue.',
  booking: 'Sign in to hold seats and complete your booking.',
}

export default function LoginPage() {
  useDocumentTitle('Log in')
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = safeRedirect(location.state?.from)
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  if (isAuthenticated && !submitting) return <Navigate to={from} replace />

  const setField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSubmitError(null)
    const found = validate(values, SCHEMA)
    setErrors(found)
    if (Object.keys(found).length) return
    setSubmitting(true)
    try {
      await login({ email: values.email.trim(), password: values.password })
      navigate(from, { replace: true })
    } catch (error) {
      setSubmitError(error)
      setSubmitting(false)
    }
  }

  const notice = REASONS[location.state?.reason]

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to book tickets and manage your bookings."
      footer={
        <>
          New to ShowTime?{' '}
          <Link to="/register" state={location.state} className="font-semibold text-ink underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <GoogleSignIn text="signin_with" onSignedIn={() => navigate(from, { replace: true })} />
      <form noValidate onSubmit={submit} className="mt-4 space-y-4">
        {notice && !submitError && <Alert>{notice}</Alert>}
        {submitError && (
          <Alert tone="error" title="Couldn't log you in">
            {authErrorMessage(submitError)}
          </Alert>
        )}
        <TextField label="Email" type="email" icon={Mail} autoComplete="email" required value={values.email} onChange={setField('email')} error={errors.email} />
        <PasswordField label="Password" autoComplete="current-password" required value={values.password} onChange={setField('password')} error={errors.password} />
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  )
}
