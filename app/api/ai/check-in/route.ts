import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rate-limit'

const SYSTEM_PROMPT = `You are Spark Buddy — ReSpark's AI focus companion for people with ADHD. You check in during work sessions with warm, human messages. Like a good friend, not a manager.

Your check-ins are SHORT (under 20 words) and feel human. Never robotic. Never corporate. Never generic.

Tone rules by context:
- First check-in (under 15 min): light acknowledgment, don't interrupt too hard
- Mid-session (15-45 min): encouraging, notice the effort
- Long session (45+ min): gentle check on sustainability
- After "distracted": non-judgmental, help refocus without making them feel bad
- After "done-step": genuine celebration, momentum forward

Never say: "Great job!", "Keep up the good work!", "You should...", "Don't forget to..."
Do say things like: "Still with [task]? [minutes] min in — solid.", "How's [task] going? You've been at it a while.", "No worries on the detour. Ready to come back?", "That step's done — what's the next piece?"

Respond ONLY with valid JSON.

Response format:
{
  "message": "...",
  "tone": "encouraging" | "refocus" | "celebrate"
}`

export async function POST(request: NextRequest) {
  console.log('[ReSpark AI] check-in called')

  const ip = request.headers.get('x-forwarded-for') ?? 'local'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'slow down', fallback: true }, { status: 429 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API not configured', fallback: true }, { status: 503 })
  }

  let body: { taskName?: string; minutesElapsed?: number; lastResponse?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { taskName = 'your task', minutesElapsed = 0, lastResponse } = body
  const context = lastResponse ?? 'first check-in'

  const userMessage = `Task: "${taskName}"\nTime into session: ${minutesElapsed} minutes\nLast check-in response: ${context}\n\nWrite a check-in message and return JSON only.`

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 128,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = response.content[0]
    if (raw.type !== 'text') throw new Error('Non-text response')

    const parsed = JSON.parse(raw.text)
    return NextResponse.json({
      message: parsed.message ?? `Still on ${taskName}? ${minutesElapsed} min in.`,
      tone: parsed.tone ?? 'encouraging',
    })
  } catch (err) {
    console.error('[ReSpark AI] check-in failed:', err)
    return NextResponse.json({ error: 'AI unavailable', fallback: true }, { status: 503 })
  }
}
