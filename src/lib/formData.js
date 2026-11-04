/** Reads a FormData value, turning blanks into null. */
export const field = (form, name) => {
  const value = form.get(name)
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

export const numberField = (form, name) => {
  const value = field(form, name)
  return value === null ? null : Number(value)
}
