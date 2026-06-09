// Each key matches the profile field expected by engine/prompt.md.
// time_of_day is captured automatically when the interview completes.
export const QUESTIONS = [
  {
    key: 'dream',
    question: 'What’s the last dream you can remember?',
    subtext: 'Don’t worry if it doesn’t make sense — the weird ones are more interesting.',
  },
  {
    key: 'childhood_space',
    question: 'Describe the place you lived when you were 10.',
    subtext: 'Not the city — the actual space. What did it look like? What did it smell like?',
  },
  {
    key: 'unsettling_sound',
    question: 'Is there a sound that gets under your skin?',
    subtext: 'Not a loud one — a subtle one that just... bothers you for no good reason.',
  },
  {
    key: 'insomnia_behavior',
    question: 'When you can’t sleep at 3 AM, what do you actually do?',
    subtext: 'Not what you should do. What you really do.',
  },
  {
    key: 'current_space',
    question: 'Look around wherever you are right now.',
    subtext: 'What’s the first thing you notice that you hadn’t noticed before?',
  },
  {
    key: 'emotional_residue',
    question: 'What feeling has been following you around this week?',
    subtext: 'Not an event — a feeling. Like a background color.',
  },
  {
    key: 'secret',
    question: 'Tell me something about yourself that almost doesn’t matter.',
    subtext:
      'Something you’ve never really mentioned to anyone — not because it’s heavy, but because the moment never came up.',
    whisper: true,
  },
]

export function captureTimeOfDay() {
  const now = new Date()
  const h = now.getHours()
  const label =
    h < 5 ? 'late night'
    : h < 9 ? 'early morning'
    : h < 12 ? 'morning'
    : h < 17 ? 'afternoon'
    : h < 21 ? 'evening'
    : 'night'
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return `${label} (${h}:${minutes}, ${zone})`
}
