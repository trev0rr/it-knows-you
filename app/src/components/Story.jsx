import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { cutToSilence } from '../audio.js'

// First paragraph waits for the curtain (the slow fade from the
// threshold's darker black) to mostly lift.
const CURTAIN_S = 1.4
// Opening cadence for paragraphs already on screen when the story opens.
const OPENING_STAGGER_MS = 400
const OPENING_BASE_MS = 1200
const OPENING_WINDOW_MS = 3000
// Paragraphs start fading ~300px before they'd enter the viewport, so
// the reader never catches the story unwritten — but the page always
// ends in darkness below.
const REVEAL_MARGIN = '0px 0px 300px 0px'
// After the final line: nothing, for a full five seconds. Then the
// interface speaks once. Then the share CTA.
const LINGER_WAIT_MS = 5000
const SHARE_AFTER_LINGER_MS = 3500

// The interface's voice, not the narrator's — built from their answers.
function lingerLine(profile) {
  if (profile?.current_space) {
    return 'The thing you noticed earlier — is it still where it was?'
  }
  const label = profile?.time_of_day?.split(' (')[0]
  if (label) return `It’s still ${label} where you are.`
  return 'It has your answers now.'
}

function typeset(text) {
  return text
    .replace(/(\w)'(\w)/g, '$1’$2') // smart apostrophes
    .replace(/ — /g, ' — ') // hair-spaced em dashes
}

const Paragraph = memo(function Paragraph({ text, isFinal, nextRevealDelay, onFinalVisible }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer = null
    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0].isIntersecting) return
        observer.disconnect()
        timer = setTimeout(() => {
          setVisible(true)
          if (isFinal) onFinalVisible()
        }, nextRevealDelay())
      },
      { rootMargin: REVEAL_MARGIN }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [isFinal, nextRevealDelay, onFinalVisible])

  return (
    <p
      ref={ref}
      className={`${visible ? 'is-visible' : ''}${isFinal ? ' is-final' : ''}`}
    >
      {typeset(text)}
    </p>
  )
})

export default function Story({ paragraphs, done, profile }) {
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [finalSeen, setFinalSeen] = useState(false)
  const [lingering, setLingering] = useState(false)
  const copiedTimeoutRef = useRef(null)
  const mountAtRef = useRef(0)
  const openingCountRef = useRef(0)

  useEffect(() => {
    mountAtRef.current = performance.now()
  }, [])

  useEffect(() => () => clearTimeout(copiedTimeoutRef.current), [])

  // The hard cut: when the first paragraph begins to surface,
  // the room goes quiet.
  useEffect(() => {
    const t = setTimeout(cutToSilence, CURTAIN_S * 1000)
    return () => clearTimeout(t)
  }, [])

  // The page darkens as the story does: scroll progress drives the
  // vignette and grain through the --depth custom property.
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const max = document.documentElement.scrollHeight - window.innerHeight
        const depth = max > 0 ? Math.min(1, window.scrollY / max) : 0
        document.documentElement.style.setProperty('--depth', depth.toFixed(3))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
      document.documentElement.style.removeProperty('--depth')
    }
  }, [])

  // Reveals during the opening window keep the slow cadence; once the
  // reader is scrolling, paragraphs surface as they approach.
  const nextRevealDelay = useCallback(() => {
    if (performance.now() - mountAtRef.current > OPENING_WINDOW_MS) return 0
    const delay = OPENING_BASE_MS + openingCountRef.current * OPENING_STAGGER_MS
    openingCountRef.current += 1
    return delay
  }, [])

  // One soft pulse, ever, when the final line lands (Android only —
  // iOS Safari doesn't expose vibrate).
  const handleFinalVisible = useCallback(() => {
    navigator.vibrate?.(15)
    setFinalSeen(true)
  }, [])

  // Final line lands → five seconds of nothing → the story dims and
  // the interface speaks → then, and only then, the share CTA.
  useEffect(() => {
    if (!finalSeen) return
    const lingerTimer = setTimeout(() => setLingering(true), LINGER_WAIT_MS)
    const shareTimer = setTimeout(
      () => setShowShare(true),
      LINGER_WAIT_MS + SHARE_AFTER_LINGER_MS
    )
    return () => {
      clearTimeout(lingerTimer)
      clearTimeout(shareTimer)
    }
  }, [finalSeen])

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
      <article className={`story-text${lingering ? ' is-dimmed' : ''}`}>
        {paragraphs.map((paragraph, i) => (
          <Paragraph
            key={i}
            text={paragraph}
            isFinal={done && i === paragraphs.length - 1}
            nextRevealDelay={nextRevealDelay}
            onFinalVisible={handleFinalVisible}
          />
        ))}
      </article>
      {lingering && <p className="linger">{lingerLine(profile)}</p>}
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
