import { useRef, useState } from 'react'
import Landing from './components/Landing.jsx'
import Interview from './components/Interview.jsx'
import Threshold from './components/Threshold.jsx'
import Story from './components/Story.jsx'
import Failure from './components/Failure.jsx'
import { captureTimeOfDay } from './questions.js'
import { startAudio, setMuted, isLive } from './audio.js'
import { streamStory, simulateStream } from './generation.js'
import { STORY_PARAGRAPHS as SAMPLE_PARAGRAPHS } from './story.js'

// Rough length of a finished story (~1750 words), for progress estimates.
const EXPECTED_CHARS = 9000

function splitParagraphs(buffer) {
  return buffer
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
}

export default function App() {
  const [phase, setPhase] = useState('landing')
  const [muted, setMutedState] = useState(false)
  const [profile, setProfile] = useState(null)

  // Generation state — the stream starts the moment Q7 submits.
  const [storyParas, setStoryParas] = useState([])
  const [storyDone, setStoryDone] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [failed, setFailed] = useState(false)
  const bufferRef = useRef('')
  const receivedRef = useRef(false)
  const cancelGenRef = useRef(null)

  function beginGeneration(profileData) {
    const handlers = {
      onText(text) {
        receivedRef.current = true
        bufferRef.current += text
        const parts = splitParagraphs(bufferRef.current)
        // The last part may still be mid-sentence — hold it back.
        setStoryParas(parts.slice(0, -1))
        setCharCount(bufferRef.current.length)
      },
      onDone() {
        setStoryParas(splitParagraphs(bufferRef.current))
        setCharCount(bufferRef.current.length)
        setStoryDone(true)
      },
      onError() {
        if (receivedRef.current) {
          // The stream broke mid-story: keep everything we have.
          handlers.onDone()
          return
        }
        if (import.meta.env.DEV) {
          // No backend in local dev: same code path, sample story.
          cancelGenRef.current = simulateStream(SAMPLE_PARAGRAPHS, handlers)
          return
        }
        // In production the sample is someone else's childhood. Serving it as
        // if it were theirs is the one lie this thing can't tell.
        setFailed(true)
      },
    }
    cancelGenRef.current = streamStory(profileData, handlers)
  }

  function handleBegin() {
    // The Begin click is the user gesture that unlocks AudioContext.
    startAudio()
    setPhase('interview')
  }

  function handleInterviewComplete(answers, hesitatedOn) {
    const fullProfile = {
      ...answers,
      time_of_day: captureTimeOfDay(),
      ...(hesitatedOn && { hesitated_on: hesitatedOn }),
    }
    setProfile(fullProfile)
    setPhase('threshold')
    beginGeneration(fullProfile)
  }

  function handleThresholdComplete() {
    setPhase('story')
  }

  // Their answers are still in state — retry the generation, not the interview.
  function handleRetry() {
    bufferRef.current = ''
    receivedRef.current = false
    setStoryParas([])
    setStoryDone(false)
    setCharCount(0)
    setFailed(false)
    setPhase('threshold')
    beginGeneration(profile)
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
      {phase === 'threshold' && (
        <Threshold
          profile={profile}
          progress={Math.min(1, charCount / EXPECTED_CHARS)}
          ready={storyParas.length > 0}
          failed={failed}
          onComplete={handleThresholdComplete}
        />
      )}
      {phase === 'story' &&
        (failed ? (
          <Failure onRetry={handleRetry} />
        ) : (
          <Story paragraphs={storyParas} done={storyDone} profile={profile} />
        ))}
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
