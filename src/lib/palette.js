// Deterministic artwork colours for items without poster images, derived from the slug so the
// same movie or event always gets the same look.

const PALETTES = [
  ['#1f3b57', '#4f7ea8'],
  ['#141b2d', '#5b4b8a'],
  ['#f2a65a', '#e0603f'],
  ['#5a3d2b', '#b8875a'],
  ['#203a43', '#e8a33d'],
  ['#0f0f14', '#6b1d2a'],
  ['#2b0a3d', '#d6336c'],
  ['#1d3557', '#e63946'],
  ['#344e41', '#a3b18a'],
  ['#0077b6', '#90e0ef'],
  ['#14213d', '#00a699'],
  ['#7f4f24', '#dda15e'],
]

export function paletteFor(key = '') {
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return PALETTES[hash % PALETTES.length]
}
