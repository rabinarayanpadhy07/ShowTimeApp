import { useState } from 'react'
import { Mail, Phone, UserRound } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { AuthLayout } from '../components/account/AuthLayout'
import { GoogleSignIn } from '../components/account/GoogleSignIn'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Checkbox, TextField } from '../components/ui/FormControls'
import { PasswordField } from '../components/ui/PasswordField'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { authErrorMessage, safeRedirect, serverFieldErrors } from '../lib/serverErrors'
import { rules, validate } from '../lib/validation'

const SCHEMA = {
  fullName: [rules.required('Full name'), rules.maxLength('Full name', 120)],
  email: [rules.required('Email'), rules.email()],
  phoneNumber: [rules.phone()],
  password: [rules.required('Password'), rules.minLength('Password', 8), rules.maxLength('Password', 72), rules.password()],
  confirmPassword: [rules.required('Please confirm your password'), rules.matches('password', 'Passwords do not match')],
  acceptTerms: [rules.checked('Please accept the terms to continue')],
}

const INITIAL = { fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', acceptTerms: false }

export default function RegisterPage() {
  useDocumentTitle('Create an account')
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = safeRedirect(location.state?.from)
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  if (isAuthenticated && !submitting) return <Navigate to={from} replace />

  const setField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setValues((current) => ({ ...current, [field]: value }))
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
      await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phoneNumber: values.phoneNumber.trim() || null,
        password: values.password,
      })
      navigate(from, { replace: true })
    } catch (error) {
      setErrors(serverFieldErrors(error))
      setSubmitError(error)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Book faster and keep all your tickets in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-ink underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
      <GoogleSignIn text="signup_with" onSignedIn={() => navigate(from, { replace: true })} />
      <form noValidate onSubmit={submit} className="mt-4 space-y-4">
        {submitError && (
          <Alert tone="error" title="Couldn't create your account">
            {authErrorMessage(submitError)}
          </Alert>
        )}
        <TextField label="Full name" icon={UserRound} autoComplete="name" required value={values.fullName} onChange={setField('fullName')} error={errors.fullName} />
        <TextField label="Email" type="email" icon={Mail} autoComplete="email" required value={values.email} onChange={setField('email')} error={errors.email} />
        <TextField label="Phone number" type="tel" icon={Phone} autoComplete="tel" hint="Optional. Used for booking updates." value={values.phoneNumber} onChange={setField('phoneNumber')} error={errors.phoneNumber} />
        <PasswordField label="Password" autoComplete="new-password" required hint="At least 8 characters, with a letter and a number." value={values.password} onChange={setField('password')} error={errors.password} />
        <PasswordField label="Confirm password" autoComplete="new-password" required value={values.confirmPassword} onChange={setField('confirmPassword')} error={errors.confirmPassword} />
        <div>
          <Checkbox label="I agree to the ShowTime terms of use and privacy policy" checked={values.acceptTerms} onChange={setField('acceptTerms')} aria-invalid={errors.acceptTerms ? true : undefined} />
          {errors.acceptTerms && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
              {errors.acceptTerms}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
