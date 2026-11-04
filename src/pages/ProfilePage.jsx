import { useState } from 'react'
import { Mail, Phone, UserRound } from 'lucide-react'

import { changePassword, updateProfile } from '../api/authApi'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/FormControls'
import { PasswordField } from '../components/ui/PasswordField'
import { Card, PageHeader } from '../components/ui/Section'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { serverFieldErrors } from '../lib/serverErrors'
import { rules, validate } from '../lib/validation'

const PROFILE_SCHEMA = {
  fullName: [rules.required('Full name'), rules.maxLength('Full name', 120)],
  phoneNumber: [rules.phone()],
}

const PASSWORD_SCHEMA = {
  currentPassword: [rules.required('Current password')],
  newPassword: [rules.required('New password'), rules.minLength('Password', 8), rules.maxLength('Password', 72), rules.password()],
  confirmPassword: [rules.required('Please confirm your new password'), rules.matches('newPassword', 'Passwords do not match')],
}

function ProfileForm() {
  const { user, updateUser } = useAuth()
  const [values, setValues] = useState({ fullName: user.fullName, phoneNumber: user.phoneNumber ?? '' })
  const [errors, setErrors] = useState({})
  const [state, setState] = useState({ saving: false, saved: false, error: null })

  const submit = async (event) => {
    event.preventDefault()
    const found = validate(values, PROFILE_SCHEMA)
    setErrors(found)
    if (Object.keys(found).length) return
    setState({ saving: true, saved: false, error: null })
    try {
      updateUser(await updateProfile({ fullName: values.fullName.trim(), phoneNumber: values.phoneNumber.trim() || null }))
      setState({ saving: false, saved: true, error: null })
    } catch (error) {
      setErrors(serverFieldErrors(error))
      setState({ saving: false, saved: false, error })
    }
  }

  return (
    <Card as="form" noValidate onSubmit={submit} aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="text-lg font-semibold text-ink">
        Personal details
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextField label="Full name" icon={UserRound} required autoComplete="name" value={values.fullName} onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))} error={errors.fullName} />
        <TextField label="Phone number" icon={Phone} type="tel" autoComplete="tel" value={values.phoneNumber} onChange={(e) => setValues((v) => ({ ...v, phoneNumber: e.target.value }))} error={errors.phoneNumber} />
        <TextField label="Email" icon={Mail} value={user.email} disabled hint="Email changes are not supported yet." className="sm:col-span-2" />
      </div>
      {state.saved && (
        <Alert tone="success" className="mt-4">
          Your details were saved.
        </Alert>
      )}
      {state.error && !Object.keys(errors).length && (
        <Alert tone="error" className="mt-4">
          {state.error.message}
        </Alert>
      )}
      <div className="mt-5 flex justify-end">
        <Button type="submit" loading={state.saving}>
          Save changes
        </Button>
      </div>
    </Card>
  )
}

function PasswordForm() {
  const { applySession } = useAuth()
  const empty = { currentPassword: '', newPassword: '', confirmPassword: '' }
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState({})
  const [state, setState] = useState({ saving: false, saved: false, error: null })
  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    const found = validate(values, PASSWORD_SCHEMA)
    setErrors(found)
    if (Object.keys(found).length) return
    setState({ saving: true, saved: false, error: null })
    try {
      applySession(await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword }))
      setValues(empty)
      setState({ saving: false, saved: true, error: null })
    } catch (error) {
      setErrors(serverFieldErrors(error))
      setState({ saving: false, saved: false, error })
    }
  }

  return (
    <Card as="form" noValidate onSubmit={submit} aria-labelledby="password-heading">
      <h2 id="password-heading" className="text-lg font-semibold text-ink">
        Change password
      </h2>
      <p className="mt-1 text-sm text-ink-muted">Changing your password signs you out on all other devices.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <PasswordField label="Current password" autoComplete="current-password" required value={values.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} className="sm:col-span-2" />
        <PasswordField label="New password" autoComplete="new-password" required hint="At least 8 characters, with a letter and a number." value={values.newPassword} onChange={set('newPassword')} error={errors.newPassword} />
        <PasswordField label="Confirm new password" autoComplete="new-password" required value={values.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
      </div>
      {state.saved && (
        <Alert tone="success" className="mt-4">
          Password changed. Other sessions have been signed out.
        </Alert>
      )}
      {state.error && (
        <Alert tone="error" className="mt-4">
          {state.error.message}
        </Alert>
      )}
      <div className="mt-5 flex justify-end">
        <Button type="submit" loading={state.saving}>
          Update password
        </Button>
      </div>
    </Card>
  )
}

export default function ProfilePage() {
  useDocumentTitle('Profile')
  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your personal details and password." />
      <div className="container-page max-w-3xl space-y-6 py-10">
        <ProfileForm />
        <PasswordForm />
      </div>
    </>
  )
}
