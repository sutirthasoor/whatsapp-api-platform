import 'server-only'
import { rows, uid, nowIso, type Row } from './store'

const GRAPH = 'https://graph.facebook.com/v21.0'
export const digits = (p: unknown) => String(p ?? '').replace(/\D/g, '')
export const waCfg = async (orgId: string): Promise<Row | undefined> => (await rows.list(`org:${orgId}`, 'waapi'))[0]
export interface SendResult { ok: boolean; id?: string; error?: string }

async function graph(cfg: Row | undefined, body: object): Promise<SendResult> {
  if (!cfg?.phoneNumberId || !cfg?.token) return { ok: false, error: 'WhatsApp API is not configured. Add your Phone number ID and access token under WhatsApp → WhatsApp API.' }
  if (cfg.connected === false) return { ok: false, error: 'WhatsApp API is disconnected. Reconnect it under WhatsApp → WhatsApp API.' }
  try {
    const r = await fetch(`${GRAPH}/${cfg.phoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', ...body }) })
    const j: any = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, error: j?.error?.message ?? `Meta API error (${r.status})` }
    return { ok: true, id: j?.messages?.[0]?.id }
  } catch (e: any) { return { ok: false, error: `Could not reach Meta: ${e?.message ?? e}` } }
}
export const sendText = async (orgId: string, to: string, text: string) => graph(await waCfg(orgId), { to: digits(to), type: 'text', text: { body: text, preview_url: true } })
export async function sendTemplate(orgId: string, to: string, tpl: Row, vars: string[] = []) {
  const n = (String(tpl.body ?? '').match(/\{\{\d+\}\}/g) ?? []).length
  const params = Array.from({ length: n }, (_, i) => ({ type: 'text', text: vars[i] ?? '' }))
  return graph(await waCfg(orgId), { to: digits(to), type: 'template', template: { name: tpl.name, language: { code: tpl.language || 'en' }, ...(n ? { components: [{ type: 'body', parameters: params }] } : {}) } })
}
export const fillVars = (body: string, vars: string[]) => String(body ?? '').replace(/\{\{(\d+)\}\}/g, (_, i) => vars[Number(i) - 1] ?? '')

/** Append a message to the conversation with this phone (creating it if needed). */
export async function recordMessage(orgId: string, phone: string, name: string, m: Partial<Row>) {
  const sc = `org:${orgId}`, d = digits(phone)
  const conv = (await rows.list(sc, 'conversations')).find(c => digits(c.phone) === d)
  const msg = { id: uid('m'), at: nowIso(), type: 'text', ...m }
  if (!conv) {
    const lead = (await rows.list(sc, 'leads')).find(l => digits(l.phone) === d) ?? (await rows.list(sc, 'customers')).find(l => digits(l.phone) === d)
    return rows.create(sc, 'conversations', { name: name || lead?.name || `+${d}`, phone: '+' + d, channel: 'WhatsApp', status: 'Open', priority: 'Normal', assignee: '', unread: m.from === 'them' ? 1 : 0, tags: [], messages: [msg], lastMessageAt: msg.at, firstMessageAt: msg.at, createdAt: nowIso(), contactType: lead ? 'Known contact' : 'New', source: 'WhatsApp' })
  }
  return rows.patchWith(sc, 'conversations', conv.id, c => ({ messages: [...(c.messages ?? []), msg], lastMessageAt: msg.at, unread: m.from === 'them' ? (c.unread ?? 0) + 1 : c.unread, status: c.status === 'Resolved' && m.from === 'them' ? 'Open' : c.status }))
}
export async function updateStatus(orgId: string, waId: string, status: string, error?: string) {
  const sc = `org:${orgId}`
  for (const c of await rows.list(sc, 'conversations')) if (c.messages?.some((m: Row) => m.waId === waId))
    await rows.patchWith(sc, 'conversations', c.id, x => ({ messages: x.messages.map((m: Row) => (m.waId === waId ? { ...m, status, ...(error ? { error } : {}) } : m)) }))
}
