// Addressed share links: ?for=Name. The name is heavily sanitized in
// both directions — it ends up rendered on the landing page.

const NAME_RE = /^\p{L}[\p{L}'’-]{0,23}/u

export function sanitizeName(raw) {
  if (!raw) return ''
  const match = String(raw).trim().match(NAME_RE)
  if (!match) return ''
  const name = match[0]
  return name[0].toUpperCase() + name.slice(1)
}

export function shareUrl(name) {
  const base = window.location.origin + window.location.pathname
  const clean = sanitizeName(name)
  return clean ? `${base}?for=${encodeURIComponent(clean)}` : base
}

export function composedMessage(name) {
  return `I answered seven questions. It wrote this about me. Your turn — ${shareUrl(name)}`
}

export function addressedName() {
  return sanitizeName(new URLSearchParams(window.location.search).get('for'))
}
