'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { PLANS } from '@/lib/platform/schema-kit'
import { Btn, Input, Label, Select, Textarea } from './ui'

async function post(body: object) {
  const r = await fetch('/api/platform/public', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error ?? 'Something went wrong')
  return j
}
const Wrap = ({ title, sub, children, color }: { title: string; sub?: string; children: React.ReactNode; color?: string }) =>
  <main className="grid min-h-screen place-items-center bg-background p-4"><div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="mb-5 h-1.5 w-12 rounded-full bg-primary" style={color ? { background: color } : undefined} /><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}<div className="mt-5">{children}</div></div></main>
const Done = ({ msg }: { msg: string }) => <div className="py-6 text-center"><CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={36} /><p className="text-sm">{msg}</p></div>

export function PublicEnquiry() {
  const [v, setV] = useState({ name: '', email: '', phone: '', company: '', interest: PLANS[0], message: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [done, setDone] = useState(false)
  const set = (k: keyof typeof v) => (x: string) => setV(p => ({ ...p, [k]: x }))
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setErr(''); try { await post({ op: 'enquiry', ...v }); setDone(true) } catch (x: any) { setErr(x.message) } setBusy(false) }
  return <Wrap title="Talk to sales" sub="Tell us about your business and we will get back to you shortly.">{done ? <Done msg="Thanks! Our team will contact you soon." /> :
    <form onSubmit={submit} className="space-y-4"><div><Label>Name *</Label><Input required value={v.name} onChange={e => set('name')(e.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label>Email</Label><Input type="email" value={v.email} onChange={e => set('email')(e.target.value)} /></div><div><Label>Phone</Label><Input type="tel" value={v.phone} onChange={e => set('phone')(e.target.value)} /></div></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label>Company</Label><Input value={v.company} onChange={e => set('company')(e.target.value)} /></div><div><Label>Interested in</Label><Select value={v.interest} onChange={e => set('interest')(e.target.value)} options={PLANS} /></div></div>
      <div><Label>Message</Label><Textarea value={v.message} onChange={e => set('message')(e.target.value)} /></div>
      {err && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}<Btn className="h-10 w-full" disabled={busy} type="submit">{busy ? 'Sending…' : 'Send enquiry'}</Btn></form>}</Wrap>
}

export function PublicLeadForm({ org, slug }: { org: string; slug: string }) {
  const [f, setF] = useState<any>(null), [nf, setNf] = useState(false), [v, setV] = useState<Record<string, string>>({}), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [msg, setMsg] = useState('')
  useEffect(() => { void fetch(`/api/platform/public?org=${encodeURIComponent(org)}&slug=${encodeURIComponent(slug)}`).then(async r => (r.ok ? setF((await r.json()).form) : setNf(true))).catch(() => setNf(true)) }, [org, slug])
  if (nf) return <Wrap title="Form not found" sub="This form is not available or has been turned off." children={null} />
  if (!f) return <Wrap title="Loading…" children={null} />
  const fields: string[] = String(f.collect || 'name,phone,email,message').split(',').map((x: string) => x.trim()).filter(Boolean)
  const req = new Set(String(f.requiredFields ?? 'name,phone').split(',').map((x: string) => x.trim()))
  const lab = (k: string) => (k === 'message' ? 'Message' : k.replace(/^./, c => c.toUpperCase()))
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('')
    try { const j = await post({ op: 'form', org, slug, data: v }); setMsg(j.message); if (j.redirect) window.location.href = j.redirect } catch (x: any) { setErr(x.message) }
    setBusy(false)
  }
  return <Wrap title={f.title || f.name} sub={f.description} color={f.brandColor}>{msg ? <Done msg={msg} /> :
    <form onSubmit={submit} className="space-y-4">{fields.map(k => <div key={k}><Label>{lab(k)}{req.has(k) ? ' *' : ''}</Label>{k === 'message' ? <Textarea value={v[k] ?? ''} onChange={e => setV({ ...v, [k]: e.target.value })} required={req.has(k)} /> : <Input type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'} value={v[k] ?? ''} onChange={e => setV({ ...v, [k]: e.target.value })} required={req.has(k)} />}</div>)}
      {err && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}<Btn type="submit" className="h-10 w-full" disabled={busy} style={f.brandColor ? { background: f.brandColor } : undefined}>{busy ? 'Sending…' : f.submitLabel || 'Submit'}</Btn></form>}</Wrap>
}
