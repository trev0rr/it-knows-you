import { useEffect, useRef, useState } from 'react'

const DISSOLVE_MS = 600
// A beat of pure darkness after the text dissolves, before question 1.
const DARK_BEAT_MS = 500

export default function Landing({ onBegin }) {
  const [leaving, setLeaving] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  function handleBegin() {
    if (leaving) return
    setLeaving(true)
    timeoutRef.current = setTimeout(onBegin, DISSOLVE_MS + DARK_BEAT_MS)
  }

  return (
    <main className="landing">
      <div className={`landing-block${leaving ? ' is-leaving' : ''}`}>
        <h1 className="landing-title">It Knows You</h1>
        <p className="landing-line">Answer seven questions honestly. We&rsquo;ll do the rest.</p>
        <button type="button" className="continue" onClick={handleBegin} disabled={leaving}>
          Begin
        </button>
      </div>
    </main>
  )
}
