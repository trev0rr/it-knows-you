import { useEffect, useRef, useState } from 'react'
import { STORY_PARAGRAPHS } from '../story.js'

// 800ms fade + 400ms before the next paragraph begins.
const PARA_STAGGER_S = 1.2
// First paragraph waits for the curtain (the slow fade from the
// threshold's darker black) to mostly lift.
const CURTAIN_S = 1.4

export default function Story() {
  const [copied, setCopied] = useState(false)
  const copiedTimeoutRef = useRef(null)

  useEffect(() => () => clearTimeout(copiedTimeoutRef.current), [])

  // One soft pulse, ever, when the final line lands.
  // Android only — iOS Safari doesn't expose vibrate.
  useEffect(() => {
    const finalLandsMs = (CURTAIN_S + (STORY_PARAGRAPHS.length - 1) * PARA_STAGGER_S + 0.8) * 1000
    const t = setTimeout(() => navigator.vibrate?.(15), finalLandsMs)
    return () => clearTimeout(t)
  }, [])

  const ctaDelay = CURTAIN_S + STORY_PARAGRAPHS.length * PARA_STAGGER_S + 1

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      clearTimeout(copiedTimeoutRef.current)
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2400)
    } catch {
      // Clipboard unavailable (insecure context) — leave the button as-is.
    }
  }

  return (
    <main className="story">
      <article className="story-text">
        {STORY_PARAGRAPHS.map((paragraph, i) => (
          <p key={i} style={{ animationDelay: `${CURTAIN_S + i * PARA_STAGGER_S}s` }}>
            {paragraph}
          </p>
        ))}
      </article>
      <footer className="share" style={{ animationDelay: `${ctaDelay}s` }}>
        <p className="share-line">Share this with someone. We&rsquo;ll write theirs too.</p>
        <button type="button" className="share-button" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </footer>
    </main>
  )
}
