const MAX_CALLS_PER_MINUTE = 20

const hits = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }

  if (entry.count >= MAX_CALLS_PER_MINUTE) {
    return false
  }

  entry.count += 1
  return true
}
