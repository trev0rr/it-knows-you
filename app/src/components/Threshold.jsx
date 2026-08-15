import { useEffect, useRef, useState } from 'react'
import { setThresholdBreathing } from '../audio.js'
import { hauntedFragment } from '../transform.js'

const INITIAL_DARKNESS = 2000
const FADE = 1400 // matches the CSS opacity transition
const GAP = 1500
const FINAL_BEAT = 400
const POLL_MS = 250
// How long to sit in darkness after "One moment." before offering
// a sign of life, if generation is slow.
const PATIENCE_MS = 30000

// Paced by the real generation: "Noted." on request start, the
// quote-back fragment, then "Almost." gated on ~80% of expected
// length. Completes at max(minimum sequence, first paragraph ready).
export default function Threshold({ profile, progress, ready, failed, onComplete }) {
  const [item, setItem] = useState(null)
  const [visible, setVisible] = useState(false)

  // Live values readable from inside the async runner.
  const progressRef = useRef(progress)
  progressRef.current = progress
  const readyRef = useRef(ready)
  readyRef.current = ready
  const failedRef = useRef(failed)
  failedRef.current = failed
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

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

  // The room tone starts breathing while it reads.
  useEffect(() => {
    setThresholdBreathing(true)
    return () => setThresholdBreathing(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

    async function waitFor(condition, timeoutMs = Infinity) {
      const start = Date.now()
      while (!cancelled && !condition() && Date.now() - start < timeoutMs) {
        await sleep(POLL_MS)
      }
    }

    async function show(entry, hold) {
      if (cancelled) return
      setItem(entry)
      setVisible(true)
      await sleep(FADE + hold)
      if (cancelled) return
      setVisible(false)
      await sleep(FADE)
    }

    async function run() {
      const fragment = hauntedFragment(profile)
      await sleep(INITIAL_DARKNESS)
      await show({ text: 'Noted.' }, 2000)
      await sleep(GAP)
      if (fragment) {
        // Their own words, slightly wrong, in the font they typed in.
        await show({ text: fragment, sans: true }, 2600)
        await sleep(GAP)
      }
      await show({ text: 'One moment.' }, 2000)

      // Hold in darkness until the story is ~80% written. A failed
      // generation releases every wait — there is nothing left to wait for.
      const written = () => progressRef.current >= 0.8 || failedRef.current
      await waitFor(written, PATIENCE_MS)
      if (!cancelled && !written()) {
        await sleep(GAP)
        await show({ text: 'Still here.' }, 2000)
        await waitFor(written, 60000)
      }

      if (!failedRef.current) {
        await sleep(GAP)
        await show({ text: 'Almost.' }, 2000)
      }
      // Never open the door before there's something behind it.
      await waitFor(() => readyRef.current || failedRef.current)
      await sleep(FINAL_BEAT)
      if (!cancelled) onCompleteRef.current()
    }

    run()
    return () => {
      cancelled = true
    }
  }, [profile])

  return (
    <main className="threshold">
      <p
        className={`threshold-phrase${item?.sans ? ' is-fragment' : ''}${
          visible ? ' is-visible' : ''
        }`}
      >
        {item?.text}
      </p>
    </main>
  )
}
