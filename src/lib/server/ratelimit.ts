const hits = new Map<string, number[]>()
/** Tiny in-memory sliding-window limiter (per server instance). */
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const list = (hits.get(key) ?? []).filter(t => now - t < windowMs)
  if (list.length >= max) { hits.set(key, list); return false }
  list.push(now); hits.set(key, list)
  if (hits.size > 5000) hits.clear()
  return true
}
