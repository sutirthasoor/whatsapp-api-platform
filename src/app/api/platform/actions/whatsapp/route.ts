import { err, isErr, json, needSession } from '@/lib/server/data'
import { rows, nowIso, type Row } from '@/lib/server/store'
import { digits, fillVars, recordMessage, sendTemplate, sendText, waCfg } from '@/lib/server/whatsapp'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const personalize = (s: string, c: Row) => String(s ?? '').replace(/\{\{name\}\}/gi, c.name ?? '').replace(/\{\{company\}\}/gi, c.company ?? '').replace(/\{\{phone\}\}/gi, c.phone ?? '')

export async function POST(req: Request) {
  const s = await needSession('customer'); if (isErr(s)) return s
  if (s.teamRole === 'Viewer') return err('Your role is read-only', 403)
  const b = await req.json().catch(() => ({})); const org = s.orgId, sc = `org:${org}`
  const templates = await rows.list(sc, 'templates')

  if (b.op === 'verify') {
    const cfg = await waCfg(org)
    if (!cfg?.phoneNumberId || !cfg?.token) return err('Enter the Phone number ID and access token first')
    const r = await fetch(`https://graph.facebook.com/v21.0/${cfg.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier`, { headers: { Authorization: `Bearer ${cfg.token}` } }).catch(e => ({ ok: false, status: 0, json: async () => ({ error: { message: String(e) } }) }) as any)
    const j: any = await r.json().catch(() => ({}))
    if (!r.ok) { await rows.upsert(sc, 'waapi', 'main', { connected: false, lastError: j?.error?.message ?? 'Verification failed' }); return err(j?.error?.message ?? 'Meta rejected these credentials', 400) }
    const patch = { connected: true, phoneNumber: j.display_phone_number, verifiedName: j.verified_name, quality: ({ GREEN: 'Green', YELLOW: 'Yellow', RED: 'Red' } as any)[j.quality_rating] ?? j.quality_rating, tier: j.messaging_limit_tier, lastError: '', verifiedAt: nowIso() }
    await rows.upsert(sc, 'waapi', 'main', patch); return json({ ok: true, ...patch })
  }

  if (b.op === 'send') {                                   // inbox reply (free text or template)
    const conv = (await rows.list(sc, 'conversations')).find(c => c.id === b.conversationId); if (!conv) return err('Conversation not found', 404)
    let r, text = String(b.text ?? '').trim()
    if (b.template) { const t = templates.find(x => x.name === b.template); if (!t) return err('Template not found'); const vars = (b.vars ?? []) as string[]; r = await sendTemplate(org, conv.phone, t, vars); text = fillVars(t.body, vars) }
    else { if (!text) return err('Message is empty'); r = await sendText(org, conv.phone, text) }
    await recordMessage(org, conv.phone, conv.name, { from: 'me', text, status: r.ok ? 'sent' : 'failed', waId: r.id, error: r.error, by: s.name, ...(b.template ? { type: 'template', template: b.template } : {}) })
    return r.ok ? json({ ok: true }) : err(r.error ?? 'Send failed', 502)
  }

  if (b.op === 'test') {
    const t = templates.find(x => x.name === b.template)
    const r = t ? await sendTemplate(org, b.to, t, b.vars ?? []) : await sendTemplate(org, b.to, { name: 'hello_world', language: 'en_US', body: '' })
    const cfg = await waCfg(org)
    await rows.upsert(sc, 'waapi', 'main', { log: [{ id: 'l' + Date.now(), to: b.to, tpl: t?.name ?? 'hello_world', at: nowIso(), status: r.ok ? 'Sent' : 'Failed', error: r.error ?? '' }, ...(cfg?.log ?? [])].slice(0, 20) })
    return r.ok ? json({ ok: true }) : err(r.error ?? 'Send failed', 502)
  }

  if (b.op === 'broadcast') {
    const bc = (await rows.list(sc, 'broadcasts')).find(x => x.id === b.id); if (!bc) return err('Broadcast not found', 404)
    if (bc.status === 'Running') return err('This broadcast is already running')
    const t = templates.find(x => x.name === bc.template); if (!t) return err('Pick an approved template for this broadcast first')
    let list: Row[] = []
    const leads = await rows.list(sc, 'leads'), custs = await rows.list(sc, 'customers')
    const at = bc.audienceType ?? 'All contacts'
    if (at === 'All leads') list = leads; else if (at === 'All customers') list = custs; else if (at === 'All contacts') list = [...custs, ...leads]
    else if (at === 'Tag') list = [...custs, ...leads].filter(c => String(c.tags ?? '').toLowerCase().split(',').map(x => x.trim()).includes(String(bc.audienceTag ?? '').toLowerCase()))
    else list = String(bc.recipients ?? '').split(/\n|,/).map(x => x.trim()).filter(Boolean).map(p => ({ name: '', phone: p }))
    const seen = new Set<string>(); list = list.filter(c => { const d = digits(c.phone); if (!d || seen.has(d) || c.optOut || c.whatsappOptIn === false) return false; seen.add(d); return true }).slice(0, 1000)
    if (!list.length) return err('No recipients with a valid phone number')
    await rows.update(sc, 'broadcasts', bc.id, { status: 'Running', startedAt: nowIso(), total: list.length })
    let sent = 0, failed = 0, lastError = ''
    for (const c of list) {
      const vars = String(bc.variables ?? '').split(',').map(v => personalize(v.trim(), c)).filter((_, i, a) => i < a.length)
      const r = await sendTemplate(org, c.phone, t, vars)
      if (r.ok) { sent++; await recordMessage(org, c.phone, c.name, { from: 'me', text: fillVars(t.body, vars), status: 'sent', waId: r.id, type: 'template', template: t.name, broadcast: bc.name }) } else { failed++; lastError = r.error ?? lastError }
      await sleep(60)
    }
    await rows.update(sc, 'broadcasts', bc.id, { sent, delivered: sent, failed, status: sent ? 'Completed' : 'Failed', completedAt: nowIso(), lastError })
    return json({ ok: true, sent, failed, lastError })
  }

  if (b.op === 'reminder') {
    const rem = (await rows.list(sc, 'reminders')).find(x => x.id === b.id); if (!rem) return err('Reminder not found', 404)
    const r = await sendText(org, rem.customerPhone, rem.message)
    await rows.update(sc, 'reminders', rem.id, { status: r.ok ? 'Sent' : 'Failed', sentAt: nowIso(), error: r.error ?? '' })
    if (r.ok) await recordMessage(org, rem.customerPhone, rem.customer, { from: 'me', text: rem.message, status: 'sent', waId: r.id })
    return r.ok ? json({ ok: true }) : err(r.error ?? 'Send failed', 502)
  }
  return err('Unknown action')
}
