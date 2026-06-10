import { useEffect, useState } from 'react'

const PHRASES = ['Noted.', 'One moment.', 'Almost.']
const INITIAL_DARKNESS = 2000
const FADE = 1400 // matches the CSS opacity transition
const HOLD = 2000
const GAP = 1500
const FINAL_BEAT = 400

// Total run: ~19.8s. In phase 2, onComplete fires at
// max(sequence finished, generation promise resolved).
export default function Threshold({ onComplete }) {
  const [phrase, setPhrase] = useState(null)
  const [visible, setVisible] = useState(false)

  // Keep the screen awake — a phone auto-dimming mid-threshold
  // kills the moment. Graceful no-op where unsupported.
  useEffect(() => {
    let lock = null
    let released = false
    async function acquire() {
      try {
        lock = await navigator.wakeLock?.request('screen')
      } catch {
        lock = null
      }
    }
    acquire()
    const onVisibility = () => {
      if (!released && document.visibilityState === 'visible') acquire()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisibility)
      lock?.release().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const timeouts = []
    let t = INITIAL_DARKNESS
    PHRASES.forEach((p, i) => {
      timeouts.push(
        setTimeout(() => {
          setPhrase(p)
          setVisible(true)
        }, t)
      )
      t += FADE + HOLD
      timeouts.push(setTimeout(() => setVisible(false), t))
      t += FADE
      t += i === PHRASES.length - 1 ? FINAL_BEAT : GAP
    })
    timeouts.push(setTimeout(onComplete, t))
    return () => timeouts.forEach(clearTimeout)
  }, [onComplete])

  return (
    <main className="threshold">
      <p className={`threshold-phrase${visible ? ' is-visible' : ''}`}>{phrase}</p>
    </main>
  )
}
