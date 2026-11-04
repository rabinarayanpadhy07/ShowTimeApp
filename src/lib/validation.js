// Client-side form validation. The backend re-validates every request with
// Bean Validation; these rules only give faster feedback.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/

export const rules = {
  required: (label) => (value) => (String(value ?? '').trim() ? null : `${label} is required`),
  email: () => (value) => (!value || EMAIL_PATTERN.test(value.trim()) ? null : 'Enter a valid email address'),
  phone: () => (value) => (!value || PHONE_PATTERN.test(value.trim()) ? null : 'Enter a valid phone number'),
  minLength: (label, length) => (value) => (!value || value.length >= length ? null : `${label} must be at least ${length} characters`),
  maxLength: (label, length) => (value) => (!value || value.length <= length ? null : `${label} must be at most ${length} characters`),
  password: () => (value) =>
    !value || (/[A-Za-z]/.test(value) && /[0-9]/.test(value)) ? null : 'Use at least one letter and one number',
  matches: (otherField, message) => (value, values) => (value === values[otherField] ? null : message),
  checked: (message) => (value) => (value ? null : message),
}

/** Runs `schema` ({ field: [rule, ...] }) against `values`; returns { field: firstError }. */
export function validate(values, schema) {
  const errors = {}
  Object.entries(schema).forEach(([field, fieldRules]) => {
    for (const rule of fieldRules) {
      const error = rule(values[field], values)
      if (error) {
        errors[field] = error
        break
      }
    }
  })
  return errors
}
