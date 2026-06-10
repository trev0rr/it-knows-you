// Client side of the streaming pipeline. Both the real stream and the
// simulated fallback speak the same handler interface, so the rest of
// the app never knows the difference.

export function streamStory(profile, { onText, onDone, onError }) {
  const controller = new AbortController()
  ;(async () => {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) throw new Error('generation unavailable')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        onText(decoder.decode(value, { stream: true }))
      }
      onDone()
    } catch (err) {
      if (err?.name !== 'AbortError') onError(err)
    }
  })()
  return () => controller.abort()
}

// Dev / API-unreachable fallback: feeds the sample story through the
// identical code path with streaming-like pacing.
export function simulateStream(paragraphs, { onText, onDone }) {
  let i = 0
  let interval = null
  const initial = setTimeout(() => {
    interval = setInterval(() => {
      if (i >= paragraphs.length) {
        clearInterval(interval)
        onDone()
        return
      }
      onText((i === 0 ? '' : '\n\n') + paragraphs[i])
      i++
    }, 650)
  }, 2200)
  return () => {
    clearTimeout(initial)
    if (interval) clearInterval(interval)
  }
}
