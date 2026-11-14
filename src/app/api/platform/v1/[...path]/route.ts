import { NextResponse } from 'next/server'
import { orgScopes, rows, nowIso } from '@/lib/server/store'
import { digits, recordMessage, sendTemplate, sendText } from '@/lib/server/whatsapp'

/** Public REST API, authenticated with an API key from Settings → API Keys. */
async function auth(req: Request) {
  const key = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!key) return null
  for (const org of await orgScopes()) { const k = (await rows.list(`org:${org}`, 'apikeys')).find(x => x.key === key && x.status === 'Active'); if (k) { await rows.update(`org:${org}`, 'apikeys', k.id, { lastUsed: nowIso(), usageCount: (k.usageCount ?? 0) + 1 }); return { org, scopes: String(k.scopes ?? 'read,write') } } }
  return null
}
const J = (d: unknown, s = 200) => NextResponse.json(d, { status: s })

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const a = await auth(req); if (!a) return J({ error: 'Invalid or missing API key' }, 401)
  const [res, id] = (await ctx.params).path, m = req.method, sc = `org:${a.org}`
  const write = m !== 'GET'; if (write && !a.scopes.includes('write')) return J({ error: 'This key is read-only' }, 403)
  if (res === 'me' && m === 'GET') return J({ workspace: ((await rows.list(sc, 'settings'))[0]?.business) ?? '', scopes: a.scopes })
  if (res === 'contacts') {
    if (m === 'GET' && !id) { const q = new URL(req.url).searchParams.get('q')?.toLowerCase(); return J({ data: (await rows.list(sc, 'leads')).filter(l => !q || JSON.stringify(l).toLowerCase().includes(q)) }) }
    if (m === 'GET') { const r = (await rows.list(sc, 'leads')).find(l => l.id === id); return r ? J(r) : J({ error: 'Not found' }, 404) }
    if (m === 'POST') { const b = await req.json().catch(() => ({})); if (!b.name && !b.phone) return J({ error: 'name or phone required' }, 400); return J(await rows.create(sc, 'leads', { status: 'New', source: 'API', createdAt: nowIso(), ...b }), 201) }
    if (m === 'PATCH' && id) { const b = await req.json().catch(() => ({})); delete b.id; const r = await rows.update(sc, 'leads', id, b); return r ? J(r) : J({ error: 'Not found' }, 404) }
  }
  if (res === 'conversations' && m === 'GET') {
    const list = await rows.list(sc, 'conversations')
    if (id) { const c = list.find(x => x.id === id); return c ? J(c) : J({ error: 'Not found' }, 404) }
    return J({ data: list.map(({ messages, ...c }) => ({ ...c, messageCount: messages?.length ?? 0 })) })
  }
  if (res === 'messages' && m === 'POST') {
    const b = await req.json().catch(() => ({})); if (!digits(b.to)) return J({ error: '"to" is required' }, 400)
    let r, text = b.text
    if (b.type === 'template') { const t = (await rows.list(sc, 'templates')).find(x => x.name === b.template); if (!t) return J({ error: 'Template not found' }, 404); r = await sendTemplate(a.org, b.to, t, b.vars ?? []); text = `[template] ${t.name}` }
    else { if (!text) return J({ error: '"text" is required' }, 400); r = await sendText(a.org, b.to, text) }
    await recordMessage(a.org, b.to, '', { from: 'me', text, status: r.ok ? 'sent' : 'failed', waId: r.id, error: r.error, by: 'API' })
    return r.ok ? J({ id: r.id, status: 'sent' }) : J({ error: r.error }, 502)
  }
  return J({ error: 'Not found' }, 404)
}
export { handle as GET, handle as POST, handle as PATCH }
