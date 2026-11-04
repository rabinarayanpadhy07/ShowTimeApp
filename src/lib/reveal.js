/**
 * Scroll-reveal for any element with a `data-reveal` attribute: it fades and rises into place the
 * first time it scrolls into view (styles in index.css). One IntersectionObserver serves the whole
 * app and a MutationObserver picks up elements as React renders them, so components only add the
 * attribute. Elements that enter the viewport together are staggered slightly, so a row of cards
 * cascades in. Without IntersectionObserver (or with reduced motion) nothing is ever hidden.
 */
const STAGGER_MS = 70
const MAX_STAGGER_MS = 420

export function initScrollReveal() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window) || !('MutationObserver' in window)) return
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced) return

  const seen = new WeakSet()
  const intersection = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
      visible.forEach((entry, index) => {
        const element = entry.target
        element.style.setProperty('--reveal-delay', `${Math.min(index * STAGGER_MS, MAX_STAGGER_MS)}ms`)
        element.setAttribute('data-revealed', '')
        intersection.unobserve(element)
      })
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  )

  const register = (root) => {
    if (!(root instanceof Element)) return
    const elements = root.matches('[data-reveal]') ? [root] : []
    elements.push(...root.querySelectorAll('[data-reveal]'))
    for (const element of elements) {
      if (seen.has(element) || element.hasAttribute('data-revealed')) continue
      seen.add(element)
      intersection.observe(element)
    }
  }

  new MutationObserver((mutations) => {
    for (const mutation of mutations) mutation.addedNodes.forEach(register)
  }).observe(document.body, { childList: true, subtree: true })

  register(document.body)
  document.documentElement.classList.add('reveal-ready')
}
