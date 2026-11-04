/** Rounds up to a clean axis maximum: 1, 2, 2.5 or 5 times a power of ten. */
export function niceMax(value) {
  if (value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * power >= value)
  return step * power
}

/** A, B, … Z, AA, AB, … */
export function nextRowLabel(labels) {
  if (labels.length === 0) return 'A'
  const last = labels[labels.length - 1]
  if (last.length === 1) return last === 'Z' ? 'AA' : String.fromCharCode(last.charCodeAt(0) + 1)
  const second = last[1] === 'Z' ? 'A' : String.fromCharCode(last.charCodeAt(1) + 1)
  return last[1] === 'Z' ? `${String.fromCharCode(last.charCodeAt(0) + 1)}A` : `${last[0]}${second}`
}
