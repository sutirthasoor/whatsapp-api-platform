import { err, isErr, json, needSession } from '@/lib/server/data'
import { aiAnswer } from '@/lib/server/ai'

export async function POST(req: Request) {
  const s = await needSession('customer'); if (isErr(s)) return s
  const b = await req.json().catch(() => ({}))
  if (!String(b.question ?? '').trim()) return err('Ask a question')
  return json(await aiAnswer(s.orgId, String(b.question), b.history ?? []))
}
