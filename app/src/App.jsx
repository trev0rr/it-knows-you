import { useState } from 'react'
import Landing from './components/Landing.jsx'
import Interview from './components/Interview.jsx'
import Threshold from './components/Threshold.jsx'
import Story from './components/Story.jsx'
import { captureTimeOfDay } from './questions.js'
import { startAudio, setMuted, isLive } from './audio.js'

export default function App() {
  const [phase, setPhase] = useState('landing')
  const [muted, setMutedState] = useState(false)
  // Held for phase 2, when the profile is sent to the generation API.
  const [profile, setProfile] = useState(null)

  function handleBegin() {
    // The Begin click is the user gesture that unlocks AudioContext.
    startAudio()
    setPhase('interview')
  }

  function handleInterviewComplete(answers, hesitatedOn) {
    setProfile({
      ...answers,
      time_of_day: captureTimeOfDay(),
      ...(hesitatedOn && { hesitated_on: hesitatedOn }),
    })
    setPhase('threshold')
  }

  function handleThresholdComplete() {
    setPhase('story')
  }

  function handleToggleMute() {
    setMutedState(m => {
      setMuted(!m)
      return !m
    })
  }

  const soundLive = phase !== 'landing' && phase !== 'story' && isLive()

  return (
    <>
      {phase === 'landing' && <Landing onBegin={handleBegin} />}
      {phase === 'interview' && <Interview onComplete={handleInterviewComplete} />}
      {phase === 'threshold' && <Threshold onComplete={handleThresholdComplete} />}
      {phase === 'story' && <Story />}
      {soundLive && (
        <button
          type="button"
          className="mute"
          onClick={handleToggleMute}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        >
          {muted ? '⊘' : '◦'}
        </button>
      )}
    </>
  )
}
