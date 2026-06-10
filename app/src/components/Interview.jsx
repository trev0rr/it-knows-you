import { useEffect, useRef, useState } from 'react'
import { QUESTIONS } from '../questions.js'

const FADE_MS = 480

// Background gains a trace of violet saturation as the interview deepens —
// felt more than seen.
function depthColor(index) {
  return `hsl(258 ${index * 1.5}% 4%)`
}

export default function Interview({ onComplete }) {
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [answers, setAnswers] = useState({})
  const [leaving, setLeaving] = useState(false)
  const textareaRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true })
  }, [index])

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  // Track the visual viewport so the question stays centered in the
  // visible area when the mobile keyboard opens.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => {
      document.documentElement.style.setProperty('--vvh', `${vv.height}px`)
      window.scrollTo(0, 0)
    }
    onResize()
    vv.addEventListener('resize', onResize)
    return () => {
      vv.removeEventListener('resize', onResize)
      document.documentElement.style.removeProperty('--vvh')
    }
  }, [])

  const q = QUESTIONS[index]
  const canContinue = value.trim().length > 0 && !leaving

  function handleContinue() {
    if (!canContinue) return
    const nextAnswers = { ...answers, [q.key]: value.trim() }
    setLeaving(true)
    timeoutRef.current = setTimeout(() => {
      if (index === QUESTIONS.length - 1) {
        onComplete(nextAnswers)
      } else {
        setAnswers(nextAnswers)
        setIndex(i => i + 1)
        setValue(nextAnswers[QUESTIONS[index + 1].key] ?? '')
        setLeaving(false)
      }
    }, FADE_MS)
  }

  function handleBack() {
    if (index === 0 || leaving) return
    // Keep the in-progress answer so it's still there if they return.
    const draft = { ...answers, [q.key]: value }
    setLeaving(true)
    timeoutRef.current = setTimeout(() => {
      setAnswers(draft)
      setIndex(i => i - 1)
      setValue(draft[QUESTIONS[index - 1].key] ?? '')
      setLeaving(false)
    }, FADE_MS)
  }

  function handleKeyDown(e) {
    // Enter advances only where a Shift+Enter newline is possible;
    // on touch keyboards Enter keeps making newlines.
    const hasHover = window.matchMedia('(hover: hover)').matches
    if (e.key === 'Enter' && !e.shiftKey && hasHover) {
      e.preventDefault()
      handleContinue()
    }
  }

  return (
    <main className="interview" style={{ backgroundColor: depthColor(index) }}>
      <div key={index} className={`question-block${leaving ? ' is-leaving' : ''}`}>
        <h1 className={`question${q.whisper ? ' whisper' : ''}`}>{q.question}</h1>
        <p className="subtext">{q.subtext}</p>
        <textarea
          ref={textareaRef}
          className="answer"
          rows={4}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={q.question}
        />
        <div className="controls">
          {index > 0 && (
            <button type="button" className="back" onClick={handleBack} disabled={leaving}>
              <span className="back-arrow">&#8592;</span> Back
            </button>
          )}
          <button
            type="button"
            className="continue"
            onClick={handleContinue}
            disabled={!canContinue}
          >
            Continue <span className="continue-arrow">&#8594;</span>
          </button>
        </div>
      </div>
      <div
        className="progress-line"
        style={{ width: `${(index / QUESTIONS.length) * 100}%` }}
        aria-hidden="true"
      />
    </main>
  )
}
