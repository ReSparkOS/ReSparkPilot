import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rate-limit'

const SYSTEM_PROMPT = `You are ReSpark's AI — you help people with ADHD decide what to do next without overwhelm.

Given a list of tasks and the user's current energy level, select the single best task to do right now.

Selection logic:
- god or fine energy: pick the highest priority active task, or the one most overdue if priorities are equal
- existing energy: pick medium priority, medium energy cost
- fumes energy: pick the lowest energy cost active task — something achievable even when exhausted

Return a brief, warm reason (under 12 words) that validates their energy state. Examples:
  "Low energy right now — this one's easy to start."
  "You've got the focus for this one today."
  "Quick win that won't drain you."

Never say "you should" — say "this one" or "start with this."
Respond ONLY with valid JSON.

Response format:
{
  "taskId": "...",
  "reason": "..."
}`

export async function POST(request: NextRequest) {
  console.log('[ReSpark AI] next-action called')

  const ip = request.headers.get('x-forwarded-for') ?? 'local'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'slow down', fallback: true }, { status: 429 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API not configured', fallback: true }, { status: 503 })
  }

  let body: { tasks?: Array<Record<string, unknown>>; energyLevel?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { tasks = [], energyLevel = 'fine' } = body
  const activeTasks = tasks.filter((t) => t.status === 'active')
  if (activeTasks.length === 0) {
    return NextResponse.json({ error: 'No active tasks', fallback: true }, { status: 400 })
  }

  const slim = activeTasks.map((t) => ({
    id: t.id,
    text: t.text,
    priority: t.priority,
    energyCost: t.energyCost,
  }))

  const userMessage = `Tasks: ${JSON.stringify(slim)}\nEnergy: ${energyLevel}\n\nPick one task and return JSON only.`

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = response.content[0]
    if (raw.type !== 'text') throw new Error('Non-text response')

    const parsed = JSON.parse(raw.text)
    const taskId = parsed.taskId
    const reason = parsed.reason ?? ''

    const found = activeTasks.find((t) => t.id === taskId)
    if (!found) {
      return NextResponse.json({ task: activeTasks[0], reason })
    }

    return NextResponse.json({ task: found, reason })
  } catch (err) {
    console.error('[ReSpark AI] next-action failed:', err)
    return NextResponse.json({ error: 'AI unavailable', fallback: true }, { status: 503 })
  }
}
