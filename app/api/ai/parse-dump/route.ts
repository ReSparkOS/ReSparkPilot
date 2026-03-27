import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rate-limit'

const SYSTEM_PROMPT = `You are ReSpark's AI assistant — a warm, direct productivity coach for adults with ADHD and neurodivergent brains.

Your job is to take a messy brain dump and turn it into clear, actionable tasks. You understand executive dysfunction, task initiation paralysis, and time blindness.

Rules:
- Extract 2-6 distinct tasks from the brain dump
- Write task text as concrete actions (verb + object), not vague descriptions. "Email Sarah about proposal" not "work stuff"
- For each task, generate 2-4 sub-steps that are genuinely tiny (under 2 minutes each)
- Assign energyCost honestly: high = requires sustained focus or is emotionally hard, medium = straightforward but takes some effort, low = quick, easy, low stakes
- Assign priority based on urgency signals in the text: urgent = time-sensitive or blocking something, soon = should happen this week, whenever = nice to do, no deadline
- Assign tag from: Work, Personal, Health, Finance, Home, Other
- Choose recommendedFirst based on the user's current energy level (provided in the request): god/fine energy → highest priority task, existing/fumes energy → lowest energyCost task
- Never use shame language, never imply the user is behind or failing
- Respond ONLY with valid JSON, no markdown, no preamble

Response format (strict JSON):
{
  "tasks": [
    {
      "text": "...",
      "tag": "Work" | "Personal" | "Health" | "Finance" | "Home" | "Other",
      "energyCost": "low" | "medium" | "high",
      "priority": "urgent" | "soon" | "whenever",
      "subSteps": ["step1", "step2", ...]
    }
  ],
  "recommendedFirstIndex": 0,
  "summary": "one sentence, warm, what you found"
}`

export async function POST(request: NextRequest) {
  console.log('[ReSpark AI] parse-dump called')

  const ip = request.headers.get('x-forwarded-for') ?? 'local'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'slow down', fallback: true }, { status: 429 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API not configured', fallback: true }, { status: 503 })
  }

  let body: { text?: string; energyLevel?: string; existingTasks?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { text, energyLevel = 'fine', existingTasks = [] } = body
  if (!text || text.trim().length < 10) {
    return NextResponse.json({ error: 'Text too short' }, { status: 400 })
  }

  const existing = existingTasks.length > 0 ? existingTasks.join(', ') : 'nothing yet'
  const userMessage = `Brain dump: "${text}"\nCurrent energy: ${energyLevel}\nAlready tracking: ${existing}\n\nExtract tasks and return JSON only.`

  const client = new Anthropic({ apiKey })

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      })

      const raw = response.content[0]
      if (raw.type !== 'text') throw new Error('Non-text response')

      const parsed = JSON.parse(raw.text)

      const now = new Date().toISOString()
      const tasks = (parsed.tasks ?? []).map((t: Record<string, unknown>, i: number) => ({
        id: crypto.randomUUID(),
        text: String(t.text ?? `Task ${i + 1}`),
        tag: t.tag ?? 'Other',
        energyCost: t.energyCost ?? 'medium',
        priority: t.priority ?? 'soon',
        subSteps: Array.isArray(t.subSteps) ? t.subSteps.map(String) : [],
        included: true,
        createdAt: now,
      }))

      if (tasks.length === 0) throw new Error('No tasks extracted')

      const recIdx = typeof parsed.recommendedFirstIndex === 'number'
        ? Math.min(parsed.recommendedFirstIndex, tasks.length - 1)
        : 0
      const recommendedFirst = tasks[recIdx]

      return NextResponse.json({
        tasks,
        recommendedFirst,
        summary: parsed.summary ?? `Found ${tasks.length} sparks in your dump`,
      })
    } catch (err) {
      if (attempt === 0) {
        console.warn('[ReSpark AI] parse-dump retry after:', err)
        continue
      }
      console.error('[ReSpark AI] parse-dump failed:', err)
      return NextResponse.json({ error: 'AI unavailable', fallback: true }, { status: 503 })
    }
  }

  return NextResponse.json({ error: 'AI unavailable', fallback: true }, { status: 503 })
}
