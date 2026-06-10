import { useEffect, useState } from 'react'
import { setThresholdBreathing } from '../audio.js'
import { hauntedFragment } from '../transform.js'

const INITIAL_DARKNESS = 2000
const FADE = 1400 // matches the CSS opacity transition
const GAP = 1500
const FINAL_BEAT = 400

// In phase 2, onComplete fires at
// max(sequence finished, generation promise resolved).
export default function Threshold({ profile, onComplete }) {
  const [item, setItem] = useState(null)
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

  // The room tone starts breathing while it reads.
  useEffect(() => {
    setThresholdBreathing(true)
    return () => setThresholdBreathing(false)
  }, [])

  useEffect(() => {
    // One fragment of their own words, slightly wrong, in the font
    // they typed in. Once, ever.
    const fragment = hauntedFragment(profile)
    const schedule = [
      { text: 'Noted.', hold: 2000 },
      ...(fragment ? [{ text: fragment, sans: true, hold: 2600 }] : []),
      { text: 'One moment.', hold: 2000 },
      { text: 'Almost.', hold: 2000 },
    ]
    const timeouts = []
    let t = INITIAL_DARKNESS
    schedule.forEach((entry, i) => {
      timeouts.push(
        setTimeout(() => {
          setItem(entry)
          setVisible(true)
        }, t)
      )
      t += FADE + entry.hold
      timeouts.push(setTimeout(() => setVisible(false), t))
      t += FADE
      t += i === schedule.length - 1 ? FINAL_BEAT : GAP
    })
    timeouts.push(setTimeout(onComplete, t))
    return () => timeouts.forEach(clearTimeout)
  }, [onComplete, profile])

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
