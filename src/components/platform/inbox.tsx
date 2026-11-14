'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, CheckCheck, Clock, Plus, Search, Send, Sparkles, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, db, useCollection, type Row } from '@/lib/platform/client-store'
import { ActionBar, Badge, Btn, Card, Empty, Input, Label, LinkBtn, Screen, Select, Textarea, fdt, run } from './ui'
import { useRoute } from './route'

const tplVars = (body: string) => Array.from(new Set((String(body ?? '').match(/\{\{\d+\}\}/g) ?? []))).length
const fill = (body: string, vars: string[]) => String(body ?? '').replace(/\{\{(\d+)\}\}/g, (_, i) => vars[Number(i) - 1] || `{{${i}}}`)

function Tick({ s }: { s?: string }) {
  if (s === 'failed') return <AlertCircle size={12} className="text-red-500" />
  if (s === 'read') return <CheckCheck size={12} className="text-sky-500" />
  if (s === 'delivered') return <CheckCheck size={12} />
  if (s === 'sent') return <Check size={12} />
  return <Clock size={12} />
}

function Thread({ conv }: { conv: Row }) {
  const { rows: templates } = useCollection('templates')
  const [text, setText] = useState(''), [tpl, setTpl] = useState(''), [vars, setVars] = useState<string[]>([]), [busy, setBusy] = useState(false), [ai, setAi] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const msgs: Row[] = conv.messages ?? []
  const t = templates.find(x => x.name === tpl)
  const usable = templates.filter(x => x.status !== 'Rejected')
  const lastIn = [...msgs].reverse().find(m => m.from === 'them')
  const windowOpen = lastIn && Date.now() - +new Date(lastIn.at) < 24 * 3600e3

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs.length, conv.id])
  useEffect(() => { if (conv.unread) void db.update('conversations', conv.id, { unread: 0 }) }, [conv.id, conv.unread])
  useEffect(() => { setVars(Array.from({ length: t ? tplVars(t.body) : 0 }, () => '')) }, [tpl]) // eslint-disable-line react-hooks/exhaustive-deps

  async function send() {
    setBusy(true)
    const ok = await run(api('actions/whatsapp', { op: 'send', conversationId: conv.id, ...(t ? { template: t.name, vars } : { text }) }), 'Message sent')
    if (ok) { setText(''); setTpl('') }
    await db.refresh('conversations'); setBusy(false)
  }
  async function suggest() {
    if (!lastIn) return void run(Promise.reject(new Error('There is no customer message to answer yet')))
    setAi(true)
    await run(async () => { const r = await api<{ text: string; error?: string }>('actions/ai', { question: lastIn.text, history: msgs.slice(-8).map(m => ({ me: m.from === 'them', text: m.text })) }); setText(r.text); if (r.error) throw new Error(r.error) })
    setAi(false)
  }
  const status = conv.status ?? 'Open'
  return <div className="flex h-full min-h-0 flex-col">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
      <div><p className="font-semibold">{conv.name}</p><p className="text-xs text-muted-foreground">{conv.phone}{conv.assignee ? ` · ${conv.assignee}` : ''}</p></div>
      <div className="flex flex-wrap items-center gap-2"><Badge>{status}</Badge>
        <Btn size="sm" variant="outline" onClick={() => run(db.update('conversations', conv.id, status === 'Resolved' ? { status: 'Open', resolvedAt: '' } : { status: 'Resolved', resolvedAt: new Date().toISOString() }), status === 'Resolved' ? 'Reopened' : 'Resolved')}>{status === 'Resolved' ? 'Reopen' : 'Resolve'}</Btn>
        <LinkBtn size="sm" variant="outline" href={`/panel/conversation/records/${conv.id}/edit`}>Details</LinkBtn></div></div>
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-card-2 p-4">
      {!msgs.length && <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Say hello below.</p>}
      {msgs.map(m => <div key={m.id} className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
        <div className={cn('max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm', m.from === 'me' ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-card')}>
          {m.type === 'template' && <p className="mb-0.5 text-[10px] uppercase opacity-70">Template · {m.template}</p>}
          <p className="whitespace-pre-wrap break-words">{m.text}</p>
          <p className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]', m.from === 'me' ? 'opacity-80' : 'text-muted-foreground')}>{m.by && m.from === 'me' ? `${m.by} · ` : ''}{fdt(m.at)}{m.from === 'me' && <Tick s={m.status} />}</p>
          {m.error && <p className="mt-1 text-[10px] text-red-200">{m.error}</p>}</div></div>)}
      <div ref={end} /></div>
    <div className="border-t border-border p-3">
      {!windowOpen && !t && <p className="mb-2 rounded-md bg-amber-500/10 px-3 py-1.5 text-xs text-amber-600">The 24-hour reply window is closed. WhatsApp only allows an approved template until the customer writes again.</p>}
      <div className="mb-2 flex flex-wrap items-center gap-2"><Select className="w-56" value={tpl} onChange={e => setTpl(e.target.value)} options={['', ...usable.map(x => x.name)]} aria-label="Template" />
        {t && vars.map((v, i) => <Input key={i} className="w-36" placeholder={`{{${i + 1}}}`} value={v} onChange={e => setVars(vars.map((x, j) => (j === i ? e.target.value : x)))} />)}
        {!t && <Btn size="sm" variant="outline" onClick={suggest} disabled={ai}><Sparkles size={13} />{ai ? 'Thinking…' : 'Suggest reply'}</Btn>}</div>
      {t ? <p className="mb-2 rounded-md bg-card-2 px-3 py-2 text-xs text-muted-foreground">{fill(t.body, vars)}</p> : null}
      <div className="flex items-end gap-2">{!t && <Textarea rows={2} className="flex-1" placeholder="Type a message…" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (text.trim()) void send() } }} />}
        <Btn onClick={send} disabled={busy || (!t && !text.trim())} className="h-10"><Send size={14} />{busy ? 'Sending…' : t ? 'Send template' : 'Send'}</Btn></div></div>
  </div>
}

export function Inbox() {
  const { base, sub } = useRoute()
  if (sub[0] === 'new') return <NewChat />
  return <InboxMain base={base} selected={sub[0]} />
}

function InboxMain({ base, selected }: { base: string; selected?: string }) {
  const { rows, ready } = useCollection('conversations', 5000)
  const router = useRouter()
  const [q, setQ] = useState(''), [f, setF] = useState('All')
  const list = useMemo(() => [...rows].filter(r => (f === 'All' || (f === 'Unread' ? r.unread > 0 : r.status === f)) && (!q || `${r.name} ${r.phone}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => String(b.lastMessageAt ?? '').localeCompare(String(a.lastMessageAt ?? ''))), [rows, q, f])
  const conv = rows.find(r => r.id === selected)
  return <div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-semibold tracking-tight">Inbox</h1><p className="text-sm text-muted-foreground">Shared team inbox on the WhatsApp Cloud API. Refreshes every few seconds.</p></div>
      <LinkBtn href={`${base}/new`}><Plus size={14} />New chat</LinkBtn></div>
    <Card className="grid h-[calc(100vh-11rem)] min-h-[480px] overflow-hidden md:grid-cols-[320px_1fr]">
      <div className={cn('flex min-h-0 flex-col border-r border-border', selected && 'hidden md:flex')}>
        <div className="space-y-2 border-b border-border p-3"><div className="relative"><Search size={14} className="absolute left-3 top-3 text-muted-foreground" /><Input className="pl-8" placeholder="Search chats" value={q} onChange={e => setQ(e.target.value)} /></div>
          <div className="flex flex-wrap gap-1">{['All', 'Unread', 'Open', 'Resolved'].map(x => <button key={x} onClick={() => setF(x)} className={cn('cursor-pointer rounded-full px-2.5 py-1 text-xs', f === x ? 'bg-primary text-primary-foreground' : 'bg-card-2 text-muted-foreground')}>{x}</button>)}</div></div>
        <div className="min-h-0 flex-1 overflow-y-auto">{!ready ? <Empty>Loading…</Empty> : !list.length ? <Empty>No conversations.</Empty> : list.map(c => {
          const last = (c.messages ?? []).at(-1)
          return <Link key={c.id} href={`${base}/${c.id}`} className={cn('block border-b border-border px-4 py-3 hover:bg-card-2', c.id === selected && 'bg-primary-soft')}>
            <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{c.name}</span><span className="shrink-0 text-[10px] text-muted-foreground">{c.lastMessageAt ? fdt(c.lastMessageAt) : ''}</span></div>
            <div className="flex items-center justify-between gap-2"><span className="truncate text-xs text-muted-foreground">{last?.text ?? c.lastMessagePreview ?? c.phone}</span>{c.unread > 0 && <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{c.unread}</span>}</div></Link>
        })}</div></div>
      <div className={cn('min-h-0', !selected && 'hidden md:block')}>
        {conv ? <div className="flex h-full flex-col"><button className="cursor-pointer border-b border-border px-4 py-2 text-left text-xs text-primary md:hidden" onClick={() => router.push(base)}>← All chats</button><div className="min-h-0 flex-1"><Thread conv={conv} /></div></div>
          : <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">{selected && ready ? 'This conversation no longer exists.' : 'Select a conversation, or start a new chat.'}</div>}</div>
    </Card></div>
}

/** Full-screen "start a conversation" — replaces the old pop-up. */
function NewChat() {
  const { base } = useRoute()
  const router = useRouter()
  const { rows: templates } = useCollection('templates')
  const { rows: leads } = useCollection('leads')
  const [v, setV] = useState({ name: '', phone: '', text: '', tpl: '' }), [vars, setVars] = useState<string[]>([]), [busy, setBusy] = useState(false)
  const t = templates.find(x => x.name === v.tpl)
  useEffect(() => { setVars(Array.from({ length: t ? tplVars(t.body) : 0 }, () => '')) }, [v.tpl]) // eslint-disable-line react-hooks/exhaustive-deps
  async function go() {
    if (!v.phone.trim()) return void run(Promise.reject(new Error('Enter a phone number with country code')))
    if (!t && !v.text.trim()) return void run(Promise.reject(new Error('Write a message or choose a template')))
    setBusy(true)
    let id = ''
    const ok = await run(async () => {
      const d = v.phone.replace(/\D/g, '')
      const ex = (await db.all('conversations')).find(c => String(c.phone).replace(/\D/g, '') === d)
      const c = ex ?? await db.create('conversations', { name: v.name || `+${d}`, phone: '+' + d, status: 'Open', priority: 'Normal', channel: 'WhatsApp', messages: [], unread: 0, createdAt: new Date().toISOString() })
      id = c.id
      await api('actions/whatsapp', { op: 'send', conversationId: c.id, ...(t ? { template: t.name, vars } : { text: v.text }) })
    }, 'Message sent')
    await db.refresh('conversations')
    if (id) router.push(`${base}/${id}`); else setBusy(false)
  }
  return <Screen narrow back={base} backLabel="Inbox" title="New chat" subtitle="Start a WhatsApp conversation with a contact.">
    <Card className="space-y-4 p-5">
      <div><Label>Pick an existing lead (optional)</Label><select className="h-9 w-full cursor-pointer rounded-lg border border-border bg-background px-3 text-sm" defaultValue="" onChange={e => { const l = leads.find(x => x.id === e.target.value); if (l) setV({ ...v, name: l.name, phone: l.phone }) }}><option value="">—</option>{leads.map(l => <option key={l.id} value={l.id}>{l.name} · {l.phone}</option>)}</select></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label>Name</Label><Input value={v.name} onChange={e => setV({ ...v, name: e.target.value })} /></div><div><Label>Phone (with country code) *</Label><Input type="tel" placeholder="+919876543210" value={v.phone} onChange={e => setV({ ...v, phone: e.target.value })} /></div></div>
      <div><Label>Template (required to open a new conversation)</Label><Select value={v.tpl} onChange={e => setV({ ...v, tpl: e.target.value })} options={['', ...templates.filter(x => x.status !== 'Rejected').map(x => x.name)]} /></div>
      {t ? <><div className="grid gap-3 sm:grid-cols-3">{vars.map((x, i) => <div key={i}><Label>{`{{${i + 1}}}`}</Label><Input value={x} onChange={e => setVars(vars.map((y, j) => (j === i ? e.target.value : y)))} /></div>)}</div><p className="rounded-md bg-card-2 px-3 py-2 text-xs text-muted-foreground">{fill(t.body, vars)}</p></>
        : <div><Label>Message</Label><Textarea rows={4} value={v.text} onChange={e => setV({ ...v, text: e.target.value })} /><p className="mt-1 text-xs text-muted-foreground">Free text only works if the contact wrote to you in the last 24 hours.</p></div>}
    </Card>
    <ActionBar><LinkBtn href={base} variant="outline">Cancel</LinkBtn><Btn onClick={go} disabled={busy}><Send size={14} />{busy ? 'Sending…' : 'Send'}</Btn></ActionBar>
  </Screen>
}
