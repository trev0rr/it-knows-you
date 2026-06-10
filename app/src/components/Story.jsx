import { useEffect, useRef, useState } from 'react'
import { cutToSilence } from '../audio.js'

// 800ms fade + 400ms before the next paragraph begins.
const PARA_STAGGER_S = 1.2
// First paragraph waits for the curtain (the slow fade from the
// threshold's darker black) to mostly lift.
const CURTAIN_S = 1.4

export default function Story({ paragraphs, done, profile }) {
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const copiedTimeoutRef = useRef(null)
  // Paragraphs present when the screen opened keep the slow opening
  // cadence; ones that stream in later surface as they arrive.
  const initialCountRef = useRef(paragraphs.length)

  useEffect(() => () => clearTimeout(copiedTimeoutRef.current), [])

  // The hard cut: when the first paragraph begins to surface,
  // the room goes quiet.
  useEffect(() => {
    const t = setTimeout(cutToSilence, CURTAIN_S * 1000)
    return () => clearTimeout(t)
  }, [])

  // When the stream finishes: one soft pulse (Android only — iOS
  // Safari doesn't expose vibrate), then the share CTA.
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => {
      navigator.vibrate?.(15)
      setShowShare(true)
    }, 2400)
    return () => clearTimeout(t)
  }, [done])

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
        {paragraphs.map((paragraph, i) => (
          <p
            key={i}
            style={{
              animationDelay:
                i < initialCountRef.current
                  ? `${CURTAIN_S + i * PARA_STAGGER_S}s`
                  : '0.15s',
            }}
          >
            {paragraph}
          </p>
        ))}
      </article>
      {showShare && (
        <footer className="share">
          <p className="share-line">Share this with someone. We&rsquo;ll write theirs too.</p>
          <button type="button" className="share-button" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </footer>
      )}
    </main>
  )
}
