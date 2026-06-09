import { useState } from 'react'
import Interview from './components/Interview.jsx'
import Threshold from './components/Threshold.jsx'
import Story from './components/Story.jsx'
import { captureTimeOfDay } from './questions.js'

export default function App() {
  const [phase, setPhase] = useState('interview')
  // Held for phase 2, when the profile is sent to the generation API.
  const [profile, setProfile] = useState(null)

  function handleInterviewComplete(answers) {
    setProfile({ ...answers, time_of_day: captureTimeOfDay() })
    setPhase('threshold')
  }

  function handleThresholdComplete() {
    setPhase('story')
  }

  if (phase === 'interview') return <Interview onComplete={handleInterviewComplete} />
  if (phase === 'threshold') return <Threshold onComplete={handleThresholdComplete} />
  return <Story />
}
