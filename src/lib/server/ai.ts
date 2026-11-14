import 'server-only'
import { rows, type Row } from './store'

export interface AiReply { text: string; src: string[]; mode: 'llm' | 'rules'; error?: string }
const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

function rulesReply(q: string, faqs: Row[], prods: Row[], cfg: Row): AiReply {
  const w = q.toLowerCase().split(/\W+/).filter(x => x.length > 2)
  if (/^(hi|hello|hey)\b/i.test(q.trim())) return { text: cfg.greeting || 'Hello! How can I help?', src: [], mode: 'rules' }
  if (cfg.useFaqs !== false) { const best = faqs.filter(f => f.status !== 'Inactive').map(f => ({ f, s: w.filter(x => (f.question + ' ' + f.answer).toLowerCase().includes(x)).length })).sort((a, b) => b.s - a.s)[0]; if (best && best.s >= 1) return { text: best.f.answer, src: [`FAQ: ${best.f.question}`], mode: 'rules' } }
  if (cfg.useProducts !== false) { const p = prods.find(x => w.some(t => String(x.name).toLowerCase().includes(t))); if (p) return { text: `${p.name} is ${inr(p.price)}${p.tax ? ` (+${p.tax}% GST)` : ''}. Want me to send a quotation?`, src: [`Product: ${p.name}`], mode: 'rules' } }
  return { text: cfg.handoff ? (cfg.handoffMessage || "I'm not fully sure about that — let me connect you with a human teammate.") : (cfg.fallback || "Sorry, I don't have that information yet."), src: [], mode: 'rules' }
}

export async function aiAnswer(orgId: string, question: string, history: { me: boolean; text: string }[] = []): Promise<AiReply> {
  const sc = `org:${orgId}`
  const [cfg = {} as Row, faqs, prods, settings] = [(await rows.list(sc, 'aiconfig'))[0], await rows.list(sc, 'faqs'), await rows.list(sc, 'products'), (await rows.list(sc, 'settings'))[0] ?? {}]
  const fallback = rulesReply(question, faqs, prods, cfg)
  if (!cfg.provider || cfg.provider === 'Rules only' || !cfg.apiKey) return fallback
  const kb = [
    cfg.useFaqs !== false && faqs.length ? 'FAQs:\n' + faqs.slice(0, 60).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n') : '',
    cfg.useProducts !== false && prods.length ? 'Products/services:\n' + prods.slice(0, 80).map(p => `- ${p.name}: ${inr(p.price)} (+${p.tax ?? 0}% GST)${p.description ? ' — ' + p.description : ''}`).join('\n') : '',
  ].filter(Boolean).join('\n\n')
  const system = `You are ${cfg.name || 'an assistant'}, the WhatsApp assistant for ${settings.business || 'a business'}. Tone: ${cfg.tone || 'Friendly'}. ${cfg.instructions || ''}\nAnswer ONLY from the knowledge below. If unsure, ${cfg.handoff ? 'say you will connect a human teammate' : 'say you do not have that information'}. Keep replies under ${cfg.maxWords || 80} words.\n\n${kb}`
  const msgs = [...history.slice(-8).map(m => ({ role: m.me ? 'user' : 'assistant', content: m.text })), { role: 'user', content: question }]
  try {
    if (cfg.provider === 'Anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: cfg.modelId || 'claude-sonnet-4-5', max_tokens: 500, temperature: Number(cfg.temperature ?? 0.4), system, messages: msgs }) })
      const j: any = await r.json(); if (!r.ok) throw new Error(j?.error?.message ?? `Anthropic error ${r.status}`)
      return { text: j.content?.map((c: any) => c.text).join('') ?? '', src: kb ? ['Knowledge base'] : [], mode: 'llm' }
    }
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${cfg.apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: cfg.modelId || 'gpt-4o-mini', temperature: Number(cfg.temperature ?? 0.4), max_tokens: 500, messages: [{ role: 'system', content: system }, ...msgs] }) })
    const j: any = await r.json(); if (!r.ok) throw new Error(j?.error?.message ?? `OpenAI error ${r.status}`)
    return { text: j.choices?.[0]?.message?.content ?? '', src: kb ? ['Knowledge base'] : [], mode: 'llm' }
  } catch (e: any) { return { ...fallback, error: `LLM call failed (${e?.message ?? e}); used rule-based answer.` } }
}
