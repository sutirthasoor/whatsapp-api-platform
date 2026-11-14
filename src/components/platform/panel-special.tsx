'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, BadgeCheck, CheckCircle2, CreditCard, Download, FileText, Image as ImageI, MessageSquare, Plug, Send, Sparkles, Upload, Users, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { api, db, useCollection, useDoc, type Row } from '@/lib/platform/client-store'
import { SCHEMAS } from '@/lib/platform/schemas'
import { Crud, DocForm, type CrudConfig } from './crud'
import { dealsCfg } from './panel-crud'
import { useRoute } from './route'
import { ActionBar, Badge, Btn, Card, CardHead, Empty, Input, Label, LinkBtn, PageHead, Screen, Select, Stat, Stats, Switch, Textarea, copy, downloadCSV, fdate, fdt, inr, run } from './ui'

const today = () => new Date().toISOString().slice(0, 10)
const Bar = ({ label, value, max, right }: { label: string; value: number; max: number; right?: string }) => <div className="mb-2"><div className="mb-1 flex justify-between text-xs"><span>{label}</span><span className="text-muted-foreground">{right ?? value}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (value / (max || 1)) * 100)}%` }} /></div></div>

/* ───────── Dashboard ───────── */
export function UserDashboard() {
  const L = useCollection('leads').rows, D = useCollection('deals').rows, C = useCollection('customers').rows, V = useCollection('conversations').rows
  const I = useCollection('invoices').rows, F = useCollection('followups').rows, M = useCollection('meetings').rows
  const { doc } = useDoc('settings')
  const open = D.filter(d => !['Won', 'Lost'].includes(d.stage)), won = D.filter(d => d.stage === 'Won')
  const due = I.filter(i => !['Paid', 'Cancelled', 'Draft'].includes(i.status)).reduce((a, i) => a + Math.max(0, (i.total || 0) - (i.paid || 0)), 0)
  const stages = ['New Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'].map(s => [s, D.filter(d => (d.stage || 'New Lead') === s).length] as const)
  const unread = V.reduce((a, c) => a + (c.unread || 0), 0)
  const pendingFu = F.filter(f => ['Pending', 'Overdue'].includes(f.status)).sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt))).slice(0, 5)
  const nextMeet = M.filter(m => m.at && m.at >= today() && m.status !== 'Cancelled').sort((a, b) => String(a.at).localeCompare(String(b.at))).slice(0, 5)
  return <div><PageHead title={`Welcome${doc.name ? `, ${String(doc.name).split(' ')[0]}` : ''}`} description={doc.business ? `${doc.business} — here is where things stand.` : 'Here is where things stand.'} actions={<><LinkBtn href="/panel/sales/leads/new" variant="outline">Add lead</LinkBtn><LinkBtn href="/panel/conversation/inbox/new">New chat</LinkBtn></>} />
    <Stats><Stat label="Leads" value={L.length} hint={`${L.filter(l => l.status === 'New').length} new`} icon={Users} /><Stat label="Open pipeline" value={inr(open.reduce((a, d) => a + (+d.value || 0), 0))} hint={`${open.length} deals`} icon={Wallet} />
      <Stat label="Unread messages" value={unread} hint={`${V.filter(c => c.status === 'Open').length} open chats`} icon={MessageSquare} /><Stat label="Outstanding" value={inr(due)} hint={`${I.filter(i => i.status === 'Overdue').length} overdue invoices`} icon={FileText} /></Stats>
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHead title="Pipeline" description={`${won.length} won · ${inr(won.reduce((a, d) => a + (+d.value || 0), 0))} closed`} action={<LinkBtn href="/panel/sales/pipeline" size="sm" variant="outline">Open board</LinkBtn>} /><div className="p-4">{stages.map(([s, n]) => <Bar key={s} label={s} value={n} max={Math.max(...stages.map(x => x[1]))} />)}</div></Card>
      <Card><CardHead title="Customers" /><div className="p-4 text-sm"><p className="text-3xl font-semibold">{C.length}</p><p className="mt-1 text-muted-foreground">{C.filter(c => c.status === 'VIP').length} VIP · {C.filter(c => c.status === 'Active').length} active</p><p className="mt-4 text-xs text-muted-foreground">Plan: <b className="text-foreground">{doc.plan || '—'}</b></p><LinkBtn href="/panel/settings/billing" size="sm" variant="outline" className="mt-2">Manage plan</LinkBtn></div></Card>
      <Card><CardHead title="Follow-ups due" action={<Link href="/panel/conversation/follow-ups" className="text-xs text-primary">All</Link>} />{pendingFu.length ? <ul className="divide-y divide-border">{pendingFu.map(f => <li key={f.id}><Link href={`/panel/conversation/follow-ups/${f.id}`} className="flex justify-between px-4 py-2.5 text-sm hover:bg-card-2"><span className="truncate">{f.task}</span><span className="shrink-0 text-xs text-muted-foreground">{fdt(f.dueAt)}</span></Link></li>)}</ul> : <Empty>Nothing pending.</Empty>}</Card>
      <Card><CardHead title="Upcoming meetings" action={<Link href="/panel/conversation/meetings" className="text-xs text-primary">All</Link>} />{nextMeet.length ? <ul className="divide-y divide-border">{nextMeet.map(m => <li key={m.id}><Link href={`/panel/conversation/meetings/${m.id}`} className="flex justify-between px-4 py-2.5 text-sm hover:bg-card-2"><span className="truncate">{m.title}</span><span className="shrink-0 text-xs text-muted-foreground">{fdt(m.at)}</span></Link></li>)}</ul> : <Empty>No meetings scheduled.</Empty>}</Card>
      <Card><CardHead title="Latest leads" action={<Link href="/panel/sales/leads" className="text-xs text-primary">All</Link>} />{L.length ? <ul className="divide-y divide-border">{L.slice(0, 5).map(l => <li key={l.id}><Link href={`/panel/sales/leads/${l.id}`} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-card-2"><span className="truncate">{l.name}</span><Badge>{l.status}</Badge></Link></li>)}</ul> : <Empty>No leads yet.</Empty>}</Card>
    </div></div>
}
export const Pipeline = () => <Crud cfg={dealsCfg} />

/* ───────── Media library ───────── */
function Upload_() {
  const ref = useRef<HTMLInputElement>(null), [busy, setBusy] = useState(false)
  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    for (const f of Array.from(files)) { const fd = new FormData(); fd.append('file', f); await run(async () => { const r = await fetch('/api/platform/media', { method: 'POST', body: fd }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error ?? 'Upload failed') }, `Uploaded ${f.name}`) }
    await db.refresh('media'); setBusy(false); if (ref.current) ref.current.value = ''
  }
  return <><input ref={ref} type="file" multiple hidden onChange={e => onFiles(e.target.files)} /><Btn onClick={() => ref.current?.click()} disabled={busy}><Upload size={14} />{busy ? 'Uploading…' : 'Upload files'}</Btn></>
}
const fileUrl = (id: string) => `/api/platform/media?id=${id}`
const mediaCfg: CrudConfig = {
  schema: SCHEMAS.media, noCreate: true, listActions: <Upload_ />,
  actions: r => [{ label: 'Open file', onClick: () => void window.open(fileUrl(r.id), '_blank') }, { label: 'Copy link', onClick: () => copy(location.origin + fileUrl(r.id)) }],
  List: ({ rows, ctx }) => !rows.length ? <Card><Empty>Your library is empty. Upload images, videos, audio or documents (up to 16 MB each).</Empty></Card> :
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">{rows.map(m => <Link key={m.id} href={`${ctx.base}/${m.id}`} className="overflow-hidden rounded-xl border border-border bg-card hover:ring-2 hover:ring-primary">
      <div className="grid h-32 place-items-center bg-card-2">{m.type === 'image' ? <img src={fileUrl(m.id)} alt={m.name} className="h-full w-full object-cover" loading="lazy" /> : <ImageI className="text-muted-foreground" />}</div>
      <div className="p-2.5"><p className="truncate text-xs font-medium">{m.name}</p><p className="text-[11px] text-muted-foreground">{m.type} · {m.size}</p></div></Link>)}</div>,
  Detail: ({ row }) => <Card><CardHead title="Preview" action={<LinkBtn size="sm" variant="outline" href={fileUrl(row.id)}><Download size={13} />Open original</LinkBtn>} /><div className="grid place-items-center p-4">{row.type === 'image' ? <img src={fileUrl(row.id)} alt={row.name} className="max-h-96 rounded-lg" /> : row.type === 'video' ? <video src={fileUrl(row.id)} controls className="max-h-96 rounded-lg" /> : row.type === 'audio' ? <audio src={fileUrl(row.id)} controls /> : <p className="text-sm text-muted-foreground">No preview for this file type.</p>}</div></Card>,
}
export const MediaLibrary = () => <Crud cfg={mediaCfg} />
export const ChatRecords = () => <Crud cfg={{ schema: SCHEMAS.conversations, noCreate: false }} />

/* ───────── WhatsApp API ───────── */
export function WhatsAppApi() {
  const { doc } = useDoc('waapi'), { rows: tpls } = useCollection('templates')
  const [busy, setBusy] = useState(false), [to, setTo] = useState(''), [tpl, setTpl] = useState('hello_world')
  const origin = typeof window === 'undefined' ? '' : location.origin
  const verify = async () => { setBusy(true); await run(api('actions/whatsapp', { op: 'verify' }), 'Connected to WhatsApp'); await db.refresh('waapi'); setBusy(false) }
  const test = async () => { setBusy(true); await run(api('actions/whatsapp', { op: 'test', to, template: tpl }), 'Test message sent'); await db.refresh('waapi'); setBusy(false) }
  return <DocForm collection="waapi" title="WhatsApp API" description="Connect your own WhatsApp Business number through Meta’s Cloud API."
    header={<div className="mb-5 grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Connection" action={doc.connected ? <Badge tone="good">Connected</Badge> : <Badge tone="bad">Not connected</Badge>} />
        <div className="space-y-2 p-4 text-sm">{doc.connected ? <><p><span className="text-muted-foreground">Number:</span> {doc.phoneNumber} · {doc.verifiedName}</p><p><span className="text-muted-foreground">Quality:</span> {doc.quality} · {doc.tier}</p></> : <p className="text-muted-foreground">Save your Phone number ID and access token below, then verify with Meta.</p>}
          {doc.lastError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{doc.lastError}</p>}<Btn onClick={verify} disabled={busy || !doc.phoneNumberId}><Plug size={14} />Verify connection</Btn></div></Card>
      <Card><CardHead title="Webhook (paste into Meta)" /><div className="space-y-3 p-4 text-xs"><div><Label>Callback URL</Label><div className="flex gap-2"><code className="flex-1 truncate rounded-md bg-card-2 px-2 py-2">{origin}/api/platform/webhook/whatsapp</code><Btn size="sm" variant="outline" onClick={() => copy(`${origin}/api/platform/webhook/whatsapp`)}>Copy</Btn></div></div>
        <div><Label>Verify token</Label><div className="flex gap-2"><code className="flex-1 truncate rounded-md bg-card-2 px-2 py-2">{doc.verifyToken || 'Set one below and save'}</code>{doc.verifyToken && <Btn size="sm" variant="outline" onClick={() => copy(doc.verifyToken)}>Copy</Btn>}</div></div></div></Card>
      <Card className="lg:col-span-2"><CardHead title="Send a test message" description="Uses an approved template — WhatsApp does not allow free text to new numbers." /><div className="flex flex-wrap items-end gap-3 p-4"><div><Label>To (with country code)</Label><Input className="w-56" value={to} onChange={e => setTo(e.target.value)} placeholder="+919876543210" /></div><div><Label>Template</Label><Select className="w-56" value={tpl} onChange={e => setTpl(e.target.value)} options={['hello_world', ...tpls.map(t => t.name).filter(n => n !== 'hello_world')]} /></div><Btn onClick={test} disabled={busy || !to}><Send size={14} />Send test</Btn></div>
        {!!doc.log?.length && <div className="border-t border-border"><table className="w-full text-xs"><tbody>{doc.log.map((l: any) => <tr key={l.id} className="border-b border-border last:border-0"><td className="px-4 py-2">{fdt(l.at)}</td><td>{l.to}</td><td>{l.tpl}</td><td><Badge>{l.status}</Badge></td><td className="text-destructive">{l.error}</td></tr>)}</tbody></table></div>}</Card></div>} />
}

/* ───────── API docs ───────── */
export function ApiDocs() {
  const origin = typeof window === 'undefined' ? 'https://your-domain.com' : location.origin
  const B = `${origin}/api/platform/v1`
  const ex: [string, string, string][] = [
    ['Who am I', 'GET /me', `curl ${B}/me -H "Authorization: Bearer $KEY"`],
    ['List contacts', 'GET /contacts?q=rahul', `curl "${B}/contacts?q=rahul" -H "Authorization: Bearer $KEY"`],
    ['Create contact', 'POST /contacts', `curl -X POST ${B}/contacts -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \\\n  -d '{"name":"Rahul","phone":"+919876543210","source":"API"}'`],
    ['Update contact', 'PATCH /contacts/{id}', `curl -X PATCH ${B}/contacts/ID -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{"status":"Qualified"}'`],
    ['List conversations', 'GET /conversations[/{id}]', `curl ${B}/conversations -H "Authorization: Bearer $KEY"`],
    ['Send text', 'POST /messages', `curl -X POST ${B}/messages -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \\\n  -d '{"to":"+919876543210","text":"Hello from the API"}'`],
    ['Send template', 'POST /messages', `curl -X POST ${B}/messages -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \\\n  -d '{"to":"+919876543210","type":"template","template":"order_update","vars":["Rahul","#1042"]}'`],
  ]
  return <div className="mx-auto max-w-4xl"><PageHead title="API docs" description="A simple REST API for your contacts, conversations and WhatsApp messages." actions={<LinkBtn href="/panel/settings/api-keys" variant="outline">Manage API keys</LinkBtn>} />
    <Card className="mb-4 p-4 text-sm"><p>Base URL <code className="rounded bg-card-2 px-1.5 py-0.5 text-xs">{B}</code></p><p className="mt-2 text-muted-foreground">Authenticate with <code className="text-xs">Authorization: Bearer &lt;key&gt;</code>. Keys with the <b>write</b> scope can create and send; read-only keys can only GET. Revoked keys stop working immediately.</p></Card>
    <div className="space-y-3">{ex.map(([t, r, c]) => <Card key={t + r}><CardHead title={t} description={r} action={<Btn size="sm" variant="outline" onClick={() => copy(c)}>Copy</Btn>} /><pre className="overflow-x-auto p-4 text-xs">{c}</pre></Card>)}</div></div>
}

/* ───────── AI ───────── */
export function AiAssistant() {
  const [log, setLog] = useState<{ me: boolean; text: string; src?: string[]; mode?: string }[]>([]), [q, setQ] = useState(''), [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [log])
  async function ask() {
    const question = q.trim(); if (!question) return
    setQ(''); setBusy(true); const hist = log
    setLog([...hist, { me: true, text: question }])
    await run(async () => { const r = await api<any>('actions/ai', { question, history: hist }); setLog(l => [...l, { me: false, text: r.text, src: r.src, mode: r.mode }]); if (r.error) toast.warning(r.error) })
    setBusy(false)
  }
  return <div className="mx-auto max-w-3xl"><PageHead title="AI assistant" description="Test how your assistant answers customers, using your FAQs and products." actions={<LinkBtn href="/panel/automation/ai-settings" variant="outline">AI settings</LinkBtn>} />
    <Card className="flex h-[60vh] flex-col"><div className="flex-1 space-y-3 overflow-y-auto p-4">{!log.length && <p className="py-10 text-center text-sm text-muted-foreground"><Sparkles className="mx-auto mb-2" size={20} />Ask something a customer might ask — e.g. “What are your prices?”</p>}
      {log.map((m, i) => <div key={i} className={`flex ${m.me ? 'justify-end' : ''}`}><div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.me ? 'bg-primary text-primary-foreground' : 'bg-card-2'}`}><p className="whitespace-pre-wrap">{m.text}</p>{m.src?.length ? <p className="mt-1 text-[10px] opacity-70">Source: {m.src.join(', ')} · {m.mode === 'llm' ? 'AI model' : 'rules'}</p> : null}</div></div>)}{busy && <p className="text-xs text-muted-foreground">Thinking…</p>}<div ref={end} /></div>
      <div className="flex gap-2 border-t border-border p-3"><Input placeholder="Ask a question…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} /><Btn onClick={ask} disabled={busy || !q.trim()}><Send size={14} />Ask</Btn></div></Card></div>
}
export const AiSettings = () => <DocForm collection="aiconfig" title="AI settings" description="Choose the model, tone, knowledge sources and handoff behaviour." />

/* ───────── Billing reports ───────── */
export function BillingReports() {
  const I = useCollection('invoices').rows, Q = useCollection('quotations').rows
  const paid = I.reduce((a, i) => a + (+i.paid || 0), 0), billed = I.filter(i => i.status !== 'Cancelled').reduce((a, i) => a + (+i.total || 0), 0)
  const months: Record<string, number> = {}
  I.forEach(i => { const m = String(i.issued ?? '').slice(0, 7); if (m) months[m] = (months[m] || 0) + (+i.total || 0) })
  const ms = Object.entries(months).sort().slice(-6), mx = Math.max(1, ...ms.map(x => x[1]))
  const aging = [['Current', (i: Row) => !i.due || i.due >= today()], ['Overdue', (i: Row) => i.due && i.due < today()]] as const
  return <div><PageHead title="Billing reports" description="Invoicing and quotation performance." actions={<Btn variant="outline" onClick={() => downloadCSV('invoices', I, ['number', 'customer', 'issued', 'due', 'total', 'paid', 'status'])} disabled={!I.length}><Download size={14} />Export invoices</Btn>} />
    <Stats><Stat label="Billed" value={inr(billed)} icon={FileText} /><Stat label="Collected" value={inr(paid)} icon={CheckCircle2} /><Stat label="Outstanding" value={inr(billed - paid)} icon={Wallet} /><Stat label="Quotes accepted" value={`${Q.filter(q => q.status === 'Accepted').length}/${Q.length}`} hint={inr(Q.filter(q => q.status === 'Accepted').reduce((a, q) => a + (+q.total || 0), 0))} icon={BadgeCheck} /></Stats>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><Card><CardHead title="Billed by month" /><div className="p-4">{ms.length ? ms.map(([m, v]) => <Bar key={m} label={m} value={v} max={mx} right={inr(v)} />) : <Empty>No invoices yet.</Empty>}</div></Card>
      <Card><CardHead title="Receivables" /><div className="p-4">{aging.map(([l, fn]) => { const rows = I.filter(i => !['Paid', 'Cancelled', 'Draft'].includes(i.status) && fn(i)); return <div key={l} className="mb-3 flex items-center justify-between text-sm"><span>{l} <span className="text-xs text-muted-foreground">({rows.length})</span></span><b>{inr(rows.reduce((a, i) => a + Math.max(0, i.total - (i.paid || 0)), 0))}</b></div> })}
        <LinkBtn href="/panel/billing/invoices" size="sm" variant="outline">Open invoices</LinkBtn></div></Card></div></div>
}

/* ───────── Settings ───────── */
export const SettingsBusiness = () => <DocForm collection="settings" title="Business profile" description="Your details, company information, invoice defaults and notifications." />

export function Security() {
  const [v, setV] = useState({ current: '', next: '', again: '' }), [busy, setBusy] = useState(false)
  const bad = v.next.length > 0 && v.next.length < 8, mismatch = v.again.length > 0 && v.next !== v.again
  return <Screen narrow title="Security" subtitle="Change the password you sign in with."><Card className="space-y-4 p-5">
    <div><Label>Current password</Label><Input type="password" autoComplete="current-password" value={v.current} onChange={e => setV({ ...v, current: e.target.value })} /></div>
    <div><Label>New password (min 8 characters)</Label><Input type="password" autoComplete="new-password" value={v.next} onChange={e => setV({ ...v, next: e.target.value })} />{bad && <p className="mt-1 text-xs text-destructive">Too short.</p>}</div>
    <div><Label>Repeat new password</Label><Input type="password" autoComplete="new-password" value={v.again} onChange={e => setV({ ...v, again: e.target.value })} />{mismatch && <p className="mt-1 text-xs text-destructive">Passwords do not match.</p>}</div>
    <Btn disabled={busy || !v.current || v.next.length < 8 || v.next !== v.again} onClick={async () => { setBusy(true); if (await run(api('auth/password', { current: v.current, next: v.next }), 'Password changed')) setV({ current: '', next: '', again: '' }); setBusy(false) }}>{busy ? 'Saving…' : 'Change password'}</Btn></Card></Screen>
}

/* ───────── Plan & billing + checkout ───────── */
export function PlanBilling() {
  const { sub } = useRoute()
  if (sub[0] === 'upgrade') return <Checkout />
  return <PlanOverview />
}
function PlanOverview() {
  const { doc } = useDoc('settings'), subs = useCollection('subscriptions').rows, pays = useCollection('payments').rows, plans = useCollection('plans').rows
  const [msg, setMsg] = useState('')
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    if (q.get('cancelled')) setMsg('Payment was cancelled. You have not been charged.')
    const sid = q.get('paid'); if (!sid) return
    void run(async () => { await api('pay', { op: 'verify', orderId: sid }); await Promise.all([db.refresh('subscriptions'), db.refresh('payments'), db.refresh('settings')]); setMsg('Payment confirmed — your plan is active.') })
  }, [])
  const active = subs.find(s => ['Active', 'Trialing'].includes(s.status)), plan = plans.find(p => p.name === (active?.plan ?? doc.plan))
  return <div className="mx-auto max-w-5xl"><PageHead title="Plan & billing" description="Your subscription, limits and payment history." actions={<LinkBtn href="/panel/settings/billing/upgrade"><CreditCard size={14} />{active ? 'Change plan' : 'Choose a plan'}</LinkBtn>} />
    {msg && <p className="mb-4 rounded-lg bg-primary-soft px-4 py-3 text-sm">{msg}</p>}
    <div className="grid gap-4 md:grid-cols-3"><Card className="p-4"><p className="text-xs text-muted-foreground">Current plan</p><p className="mt-1 text-2xl font-semibold">{active?.plan ?? (doc.plan || '—')}</p>{active && <p className="mt-1 text-xs text-muted-foreground"><Badge>{active.status}</Badge> {active.cycle} · renews {fdate(active.renewsOn)}</p>}</Card>
      <Card className="p-4 md:col-span-2"><p className="text-xs text-muted-foreground">Included in your plan</p>{plan ? <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><span><b>{plan.seats}</b> seats</span><span><b>{Number(plan.messages).toLocaleString('en-IN')}</b> messages</span><span><b>{Number(plan.contacts).toLocaleString('en-IN')}</b> contacts</span><span><b>{plan.storageGb}</b> GB storage</span></div> : <p className="mt-2 text-sm text-muted-foreground">No plan selected yet.</p>}</Card></div>
    <Card className="mt-4"><CardHead title="Payment history" />{pays.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="px-4 py-2">Ref</th><th>Plan</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead><tbody>{pays.map(p => <tr key={p.id} className="border-b border-border last:border-0"><td className="px-4 py-2.5 font-mono text-xs">{p.ref}</td><td>{p.plan} · {p.cycle}</td><td>{inr(p.amount)}</td><td>{p.method}</td><td><Badge>{p.status}</Badge></td><td>{fdate(p.date)}</td></tr>)}</tbody></table></div> : <Empty>No payments yet.</Empty>}</Card></div>
}

declare global { interface Window { Razorpay?: any } }
function Checkout() {
  const router = useRouter()
  const plans = useCollection('plans').rows.filter(p => p.status === 'Active' && p.visibility !== 'Hidden' && p.visibility !== 'Private')
  const [gws, setGws] = useState<any[]>([]), [planId, setPlanId] = useState(''), [cycle, setCycle] = useState<'Monthly' | 'Yearly'>('Monthly'), [gw, setGw] = useState(''), [busy, setBusy] = useState(false), [offline, setOffline] = useState<any>(null)
  useEffect(() => { void run(async () => { const j = await api<{ gateways: any[] }>('pay', { op: 'options' }); setGws(j.gateways); setGw(j.gateways.find(g => g.isDefault)?.id ?? j.gateways[0]?.id ?? '') }) }, [])
  const plan = plans.find(p => p.id === planId), total = plan ? Math.round((cycle === 'Yearly' ? plan.priceYearly : plan.priceMonthly) * (1 + (+plan.taxPercent || 0) / 100) * 100) / 100 : 0

  async function pay() {
    setBusy(true)
    await run(async () => {
      const r = await api<any>('pay', { op: 'create', planId, cycle, gatewayId: gw })
      if (r.offline) { setOffline(r); return }
      if (r.provider === 'stripe' && r.url) { window.location.href = r.url; return }
      if (r.provider === 'razorpay') {
        if (!window.Razorpay) await new Promise<void>((ok, no) => { const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = () => ok(); s.onerror = () => no(new Error('Could not load Razorpay')); document.body.appendChild(s) })
        new window.Razorpay({ key: r.keyId, order_id: r.orderId, amount: r.amount, currency: r.currency, name: 'WhatsCRM', description: `${r.plan} · ${r.cycle}`,
          handler: async (x: any) => { await run(api('pay', { op: 'verify', orderId: r.orderId, paymentId: x.razorpay_payment_id, signature: x.razorpay_signature }), 'Payment successful'); router.push('/panel/settings/billing') } }).open()
      }
    })
    setBusy(false)
  }
  if (offline) return <Screen narrow title="Payment instructions" subtitle="Your plan activates once the admin verifies your payment."><Card className="space-y-3 p-5 text-sm"><p>Amount: <b>{inr(offline.amount)}</b> · Reference <code>{`OFF-${String(offline.id).slice(-6).toUpperCase()}`}</code></p><p className="whitespace-pre-wrap rounded-lg bg-card-2 p-3">{offline.instructions || 'Transfer the amount and share the reference with support.'}</p><LinkBtn href="/panel/settings/billing">Back to billing</LinkBtn></Card></Screen>
  return <Screen back="/panel/settings/billing" backLabel="Plan & billing" title="Choose a plan" subtitle="Prices include GST. Cancel or change any time.">
    <div className="mb-4 inline-flex rounded-lg border border-border p-0.5">{(['Monthly', 'Yearly'] as const).map(c => <button key={c} onClick={() => setCycle(c)} className={`cursor-pointer rounded-md px-4 py-1.5 text-sm ${cycle === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{c}</button>)}</div>
    {!plans.length ? <Empty>No plans are available yet.</Empty> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{plans.map(p => <button key={p.id} onClick={() => setPlanId(p.id)} className={`cursor-pointer rounded-xl border bg-card p-4 text-left transition ${planId === p.id ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/50'}`}>
      <div className="flex items-center justify-between"><b>{p.name}</b>{p.badge && <Badge>{p.badge}</Badge>}</div><p className="mt-1 text-2xl font-semibold">{inr(cycle === 'Yearly' ? p.priceYearly : p.priceMonthly)}<span className="text-xs font-normal text-muted-foreground"> /{cycle === 'Yearly' ? 'year' : 'month'}</span></p>
      <p className="mt-1 text-xs text-muted-foreground">{p.seats} seats · {Number(p.messages).toLocaleString('en-IN')} messages · {Number(p.contacts).toLocaleString('en-IN')} contacts</p>
      <ul className="mt-2 space-y-0.5 text-xs">{String(p.features ?? '').split(/[,\n]/).filter(Boolean).slice(0, 5).map(f => <li key={f}>✓ {f.trim()}</li>)}</ul></button>)}</div>}
    <Card className="mt-5 p-4"><p className="mb-2 text-sm font-semibold">Payment method</p>{gws.length ? <div className="grid gap-2 sm:grid-cols-2">{gws.map(g => <label key={g.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${gw === g.id ? 'border-primary bg-primary-soft' : 'border-border'}`}><input type="radio" checked={gw === g.id} onChange={() => setGw(g.id)} />{g.name}{g.mode === 'Test' && <Badge tone="warn">Test</Badge>}<span className="ml-auto text-xs text-muted-foreground">{g.methods}</span></label>)}</div> : <p className="text-sm text-muted-foreground">The admin has not enabled any payment gateway yet.</p>}</Card>
    <ActionBar><span className="mr-auto text-sm">{plan ? <>Total <b>{inr(total)}</b> / {cycle === 'Yearly' ? 'year' : 'month'}</> : 'Select a plan'}</span><LinkBtn href="/panel/settings/billing" variant="outline">Cancel</LinkBtn><Btn disabled={!plan || !gw || busy} onClick={pay}><CreditCard size={14} />{busy ? 'Please wait…' : 'Pay now'}</Btn></ActionBar></Screen>
}
