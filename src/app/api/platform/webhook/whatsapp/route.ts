import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { orgByPhoneNumberId, rows, orgScopes, type Row } from '@/lib/server/store'
import { aiAnswer } from '@/lib/server/ai'
import { recordMessage, sendText, updateStatus, waCfg } from '@/lib/server/whatsapp'

/** Meta calls GET once to verify, then POSTs inbound messages + delivery statuses. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  if (q.get('hub.mode') === 'subscribe') {
    for (const org of await orgScopes()) if ((await waCfg(org))?.verifyToken === q.get('hub.verify_token')) return new NextResponse(q.get('hub.challenge'), { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

const matches = (rule: Row, t: string) => { const k = String(rule.trigger).toLowerCase().trim(), x = t.toLowerCase().trim(); return rule.matchType === 'Exact' ? x === k : rule.matchType === 'Starts with' ? x.startsWith(k) : x.includes(k) }

export async function POST(req: Request) {
  const raw = await req.text()
  let payload: any; try { payload = JSON.parse(raw) } catch { return NextResponse.json({ ok: false }, { status: 400 }) }
  for (const entry of payload.entry ?? []) for (const ch of entry.changes ?? []) {
    const v = ch.value; if (!v) continue
    const org = await orgByPhoneNumberId(v.metadata?.phone_number_id); if (!org) continue
    const cfg = await waCfg(org)
    if (cfg?.appSecret) {                                  // verify Meta's HMAC when the org stored its app secret
      const sig = req.headers.get('x-hub-signature-256') ?? ''
      const good = 'sha256=' + crypto.createHmac('sha256', cfg.appSecret).update(raw).digest('hex')
      if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) continue
    }
    for (const st of v.statuses ?? []) await updateStatus(org, st.id, st.status, st.errors?.[0]?.title)
    for (const m of v.messages ?? []) {
      const name = v.contacts?.find((c: any) => c.wa_id === m.from)?.profile?.name ?? ''
      const text = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? `[${m.type}]`
      await recordMessage(org, m.from, name, { from: 'them', text, waId: m.id, type: m.type, at: new Date(Number(m.timestamp) * 1000).toISOString() })
      if (m.type !== 'text' || cfg?.autoRepliesPaused) continue
      // 1) keyword chatbot rules, 2) AI / FAQ assistant
      const rule = (await rows.list(`org:${org}`, 'chatbot')).find(r => r.status !== 'Inactive' && matches(r, text))
      let reply = rule?.reply, src = rule ? 'chatbot' : ''
      if (rule) await rows.update(`org:${org}`, 'chatbot', rule.id, { hits: (rule.hits ?? 0) + 1, lastTriggeredAt: new Date().toISOString() })
      else { const ai = (await rows.list(`org:${org}`, 'aiconfig'))[0]; if (ai?.autoReply) { reply = (await aiAnswer(org, text)).text; src = 'ai' } }
      if (reply) { const r = await sendText(org, m.from, reply); await recordMessage(org, m.from, name, { from: 'me', text: reply, status: r.ok ? 'sent' : 'failed', waId: r.id, error: r.error, by: src === 'ai' ? 'AI assistant' : 'Chatbot' }) }
    }
  }
  return NextResponse.json({ ok: true })
}
