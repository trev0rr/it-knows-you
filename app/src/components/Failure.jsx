import { useEffect } from 'react'
import { cutToSilence } from '../audio.js'

// The door opens and there is nothing behind it. Same staging as the
// threshold — one line, no explanation, one way back.
export default function Failure({ onRetry }) {
  // Match Story: the room goes quiet when the door opens. Without this the
  // bed keeps playing with no mute glyph on screen to stop it.
  useEffect(cutToSilence, [])

  return (
    <main className="threshold is-failure">
      <p className="threshold-phrase is-visible">It couldn&rsquo;t hold you.</p>
      <button type="button" className="continue" onClick={onRetry}>
        Again
      </button>
    </main>
  )
}
