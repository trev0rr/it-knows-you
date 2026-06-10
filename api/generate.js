// Vercel serverless function: streams the story as plain text chunks.
// The API key lives in process.env (Vercel env var) — never the client.
// engine/prompt.md stays the single source of truth for the system prompt.
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

const FIELDS = [
  'dream',
  'childhood_space',
  'unsettling_sound',
  'insomnia_behavior',
  'current_space',
  'emotional_residue',
  'secret',
  'time_of_day',
  'hesitated_on',
]
const MAX_FIELD_CHARS = 2000

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end()
    return
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = null
    }
  }

  const profile = {}
  for (const field of FIELDS) {
    const value = body?.[field]
    if (typeof value === 'string' && value.trim()) {
      profile[field] = value.slice(0, MAX_FIELD_CHARS)
    }
  }
  if (Object.keys(profile).length < 3) {
    res.statusCode = 400
    res.end('invalid profile')
    return
  }

  const systemPrompt = readFileSync(join(process.cwd(), 'engine', 'prompt.md'), 'utf-8')
  const client = new Anthropic()

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  })

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 4500,
      system: systemPrompt,
      messages: [{ role: 'user', content: JSON.stringify(profile, null, 2) }],
    })
    stream.on('text', text => res.write(text))
    await stream.finalMessage()
  } catch {
    // Headers already sent — the client treats a truncated stream
    // with content as a complete-enough story, and an empty one as
    // a failure it can recover from.
  } finally {
    res.end()
  }
}
