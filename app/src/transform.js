// The interface obeys the same rule as the engine prompt: the user
// should recognize their words but never point at them and say
// "that's exactly what I wrote." One fragment, flipped to second
// person, one word altered. Shown once, ever.

const VERB_SWAPS = [
  ['whining', 'waiting'],
  ['whines', 'waits'],
  ['looking at', 'watching'],
  ['staring at', 'watching'],
  ['looking', 'watching'],
  ['standing', 'staying'],
  ['humming', 'breathing'],
  ['scratching', 'knocking'],
  ['crying', 'calling'],
]

const PLACE_FLIPS = [
  ['outside', 'inside'],
  ['behind', 'beside'],
  ['above', 'beneath'],
  ['under', 'over'],
]

const PRONOUNS = [
  [/\bI'm\b/g, "you're"],
  [/\bI've\b/g, "you've"],
  [/\bI'll\b/g, "you'll"],
  [/\bI\b/g, 'you'],
  [/\bmy\b/gi, 'your'],
  [/\bmine\b/gi, 'yours'],
  [/\bme\b/gi, 'you'],
  [/\bmyself\b/gi, 'yourself'],
  [/\bwe\b/gi, 'you'],
  [/\bour\b/gi, 'your'],
  [/\bam\b/g, 'are'],
]

// Prefer the sensory answers; they make the best fragments.
const SOURCES = ['unsettling_sound', 'current_space', 'dream']

export function hauntedFragment(profile) {
  if (!profile) return null
  for (const key of SOURCES) {
    const raw = (profile[key] || '').trim()
    if (raw.length < 12) continue
    let fragment = raw.split(/[.!?\n]/)[0].trim()
    if (fragment.length > 64) {
      fragment = fragment.slice(0, 64).replace(/\s+\S*$/, '')
    }
    if (fragment.length < 12) continue
    return transform(fragment)
  }
  return null
}

function transform(fragment) {
  let out = fragment
  for (const [re, replacement] of PRONOUNS) {
    out = out.replace(re, replacement)
  }
  // Alter exactly one word: a verb from the map, or a spatial flip.
  let altered = false
  for (const [from, to] of VERB_SWAPS) {
    const re = new RegExp(`\\b${from}\\b`, 'i')
    if (re.test(out)) {
      out = out.replace(re, to)
      altered = true
      break
    }
  }
  if (!altered) {
    for (const [from, to] of PLACE_FLIPS) {
      const re = new RegExp(`\\b${from}\\b`, 'i')
      if (re.test(out)) {
        out = out.replace(re, to)
        break
      }
    }
  }
  // Repair agreement broken by the pronoun flip.
  out = out.replace(/\byou was\b/gi, 'you were')
  // Lowercase, like something half-remembered rather than quoted.
  return out.toLowerCase()
}
