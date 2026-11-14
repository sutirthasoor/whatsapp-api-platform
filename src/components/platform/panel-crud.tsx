'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { db, api, useCollection, type Row } from '@/lib/platform/client-store'
import { SCHEMAS } from '@/lib/platform/schemas'
import { STAGES } from '@/lib/platform/collections'
import { computeTotals } from '@/lib/platform/calc'
import { Crud, type CrudConfig } from './crud'
import { Badge, Btn, Card, CardHead, Empty, Input, LinkBtn, Screen, copy, fdt, inr, run } from './ui'

const S = SCHEMAS
const now = () => new Date().toISOString()
const today = () => now().slice(0, 10)
const pick = (r: Row, keys: string[]) => Object.fromEntries(keys.filter(k => r[k] !== undefined && r[k] !== '').map(k => [k, r[k]]))

/* ───────── Pipeline (deals board) ───────── */
function Board({ rows, ctx }: { rows: Row[]; ctx: { base: string } }) {
  const [drag, setDrag] = useState<string | null>(null), [over, setOver] = useState('')
  const move = (id: string, stage: string) => { const d = rows.find(r => r.id === id); if (d && d.stage !== stage) void run(db.update('deals', id, { stage, ...(stage === 'Won' || stage === 'Lost' ? { actualCloseDate: today() } : {}), lastActivityAt: now() }), `Moved to ${stage}`) }
  return <div className="flex gap-3 overflow-x-auto pb-3">{STAGES.map(st => {
    const items = rows.filter(r => (r.stage || 'New Lead') === st), total = items.reduce((a, r) => a + (Number(r.value) || 0), 0)
    return <div key={st} onDragOver={e => { e.preventDefault(); setOver(st) }} onDragLeave={() => setOver('')} onDrop={() => { if (drag) move(drag, st); setDrag(null); setOver('') }}
      className={`w-72 shrink-0 rounded-xl border bg-card-2 p-2 ${over === st ? 'border-primary' : 'border-border'}`}>
      <div className="mb-2 flex items-center justify-between px-2 pt-1"><span className="text-sm font-semibold">{st} <span className="text-xs font-normal text-muted-foreground">{items.length}</span></span><span className="text-xs text-muted-foreground">{inr(total)}</span></div>
      <div className="space-y-2">{items.map(d => <div key={d.id} draggable onDragStart={() => setDrag(d.id)} className="cursor-grab rounded-lg border border-border bg-card p-3 text-sm">
        <Link href={`${ctx.base}/${d.id}`} className="font-medium hover:text-primary">{d.title}</Link>
        <p className="text-xs text-muted-foreground">{d.contact}{d.company ? ` · ${d.company}` : ''}</p>
        <div className="mt-2 flex items-center justify-between"><span className="font-semibold">{inr(d.value)}</span>{d.priority && <Badge>{d.priority}</Badge>}</div>
        <select aria-label="Move to stage" value={d.stage} onChange={e => move(d.id, e.target.value)} className="mt-2 h-7 w-full cursor-pointer rounded-md border border-border bg-background px-1 text-xs">{STAGES.map(x => <option key={x}>{x}</option>)}</select></div>)}
        {!items.length && <p className="px-2 py-6 text-center text-xs text-muted-foreground">Drop a deal here</p>}</div></div>
  })}</div>
}

/* ───────── Ticket thread (customer side) ───────── */
function TicketThread({ row, staff }: { row: Row; staff?: boolean }) {
  const [text, setText] = useState('')
  const replies: any[] = row.replies ?? []
  async function send() {
    if (!text.trim()) return
    const ok = await run(staff ? api('actions/admin', { op: 'ticket-reply', id: row.id, text }) : db.update('tickets', row.id, { replies: [...replies, { by: 'You', text, at: now(), staff: false }], status: row.status === 'Waiting on customer' ? 'In progress' : row.status }), 'Reply sent')
    if (ok) { setText(''); await db.refresh('tickets') }
  }
  return <Card><CardHead title="Conversation" description={`${replies.length} message${replies.length === 1 ? '' : 's'}`} />
    <div className="space-y-3 p-4">{replies.map((r, i) => <div key={i} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${r.staff ? 'bg-primary-soft' : 'ml-auto bg-card-2'}`}><p className="mb-0.5 text-[11px] text-muted-foreground">{r.by} · {fdt(r.at)}</p><p className="whitespace-pre-wrap">{r.text}</p></div>)}
      {row.status === 'Closed' ? <p className="text-xs text-muted-foreground">This ticket is closed.</p> : <div className="flex gap-2 pt-2"><Input placeholder="Write a reply…" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} /><Btn onClick={send} disabled={!text.trim()}>Send</Btn></div>}</div></Card>
}
export const ticketCfg = (staff: boolean): CrudConfig => ({
  schema: S.tickets, Detail: ({ row }) => <TicketThread row={row} staff={staff} />,
  actions: row => staff ? [{ label: 'Mark resolved', onClick: () => run(db.update('tickets', row.id, { status: 'Resolved', resolvedAt: now() }), 'Ticket resolved') }, { label: 'Close', onClick: () => run(db.update('tickets', row.id, { status: 'Closed', closedAt: now() }), 'Ticket closed') }] : [],
})

/* ───────── per-collection configs ───────── */
export const PANEL_CRUD: Record<string, CrudConfig> = {
  'sales/leads': { schema: S.leads, actions: (r, c) => [
    { label: 'Convert to customer', onClick: async () => { if (await run(async () => { await db.create('customers', { ...pick(r, ['name', 'company', 'phone', 'email', 'city', 'state', 'country', 'gstin', 'tags']), status: 'Active', since: today(), leadId: r.id }); await db.update('leads', r.id, { status: 'Won' }) }, 'Converted to customer')) c.go('/panel/sales/customers') } },
    { label: 'Open chat', onClick: async () => { const ex = (await db.all('conversations')).find(x => String(x.phone).replace(/\D/g, '') === String(r.phone).replace(/\D/g, '')); if (ex) c.go(`/panel/conversation/inbox/${ex.id}`); else { const n = await db.create('conversations', { name: r.name, phone: r.phone, leadId: r.id, status: 'Open', priority: 'Normal', channel: 'WhatsApp', messages: [], unread: 0, createdAt: now() }); c.go(`/panel/conversation/inbox/${n.id}`) } } },
  ] },
  'sales/customers': { schema: S.customers },
  'conversation/follow-ups': { schema: S.followups, actions: r => r.status === 'Done' ? [] : [{ label: 'Mark done', onClick: () => run(db.update('followups', r.id, { status: 'Done', completedAt: now() }), 'Marked done') }] },
  'conversation/meetings': { schema: S.meetings },
  'conversation/calls': { schema: S.calls },
  'marketing/campaign-reports': { schema: S.campaigns },
  'marketing/lead-form': { schema: S.leadforms, actions: (r, c) => [{ label: 'Copy public link', onClick: async () => { const org = (await api<{ rows: Row[] }>('data/team')).rows.find(t => t.teamRole === 'Owner')?.id; copy2(`${location.origin}/f/${org}/${r.slug}`) } }] },
  'whatsapp/templates': { schema: S.templates },
  'whatsapp/forms': { schema: S.waforms },
  'whatsapp/broadcast-logs': { schema: S.broadcasts, actions: r => ['Running'].includes(r.status) ? [] : [{ label: r.status === 'Completed' ? 'Send again' : 'Send now', onClick: async () => { toast.info('Sending broadcast…'); const ok = await run(async () => { const j = await api<any>('actions/whatsapp', { op: 'broadcast', id: r.id }); toast.success(`Sent ${j.sent}, failed ${j.failed}${j.lastError ? ` — ${j.lastError}` : ''}`) }); void ok; await db.refresh('broadcasts') } }] },
  'automation/chatbot': { schema: S.chatbot },
  'automation/faq-bot': { schema: S.faqs },
  products: { schema: S.products },
  'billing/quotations': { schema: S.quotations, actions: (r, c) => [
    ...(r.status === 'Draft' ? [{ label: 'Mark as sent', onClick: () => run(db.update('quotations', r.id, { status: 'Sent', sentAt: now() }), 'Marked as sent') }] : []),
    ...(r.status === 'Sent' ? [{ label: 'Mark accepted', onClick: () => run(db.update('quotations', r.id, { status: 'Accepted', acceptedAt: now() }), 'Quotation accepted') }] : []),
    { label: 'Convert to invoice', onClick: async () => { const n = (await db.all('invoices')).length + 1; const inv = await db.create('invoices', { ...pick(r, ['customer', 'customerCompany', 'customerPhone', 'customerEmail', 'customerGstin', 'customerAddress', 'shippingAddress', 'placeOfSupply', 'lineItems', 'discountPercent', 'discountAmount', 'shipping', 'currency', 'paymentTerms', 'terms', 'notesToCustomer', 'bankDetails', 'salesperson']), number: `INV-${String(n).padStart(4, '0')}`, quotationNo: r.number, status: 'Unpaid', issued: today(), due: new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10), paid: 0, ...computeTotals(r) }); await db.update('quotations', r.id, { convertedInvoice: inv.number, status: 'Accepted' }); toast.success('Invoice created'); c.go(`/panel/billing/invoices/${inv.id}`) } },
  ] },
  'billing/invoices': { schema: S.invoices, actions: (r, c) => [
    ...(r.status !== 'Paid' && r.status !== 'Cancelled' ? [{ label: 'Record full payment', onClick: () => run(db.update('invoices', r.id, { status: 'Paid', paid: r.total, paidOn: today() }), 'Invoice marked paid') }] : []),
    ...(r.status !== 'Paid' ? [{ label: 'Create payment reminder', onClick: async () => { const x = await db.create('reminders', { invoice: r.number, customer: r.customer, customerPhone: r.customerPhone, customerEmail: r.customerEmail, channel: 'WhatsApp', status: 'Scheduled', sendOn: now().slice(0, 16), amountDue: Math.max(0, (r.total || 0) - (r.paid || 0)), dueDate: r.due, currency: r.currency || 'INR', message: `Hi ${r.customer}, a gentle reminder that invoice ${r.number} for ${inr(Math.max(0, (r.total || 0) - (r.paid || 0)))} is due on ${r.due || 'the due date'}. Thank you!` }); c.go(`/panel/billing/reminders/${x.id}`) } }] : []),
  ] },
  'billing/reminders': { schema: S.reminders, actions: r => r.status === 'Sent' ? [] : [{ label: 'Send now', onClick: async () => { await run(api('actions/whatsapp', { op: 'reminder', id: r.id }), 'Reminder sent on WhatsApp'); await db.refresh('reminders') } }] },
  support: ticketCfg(false),
  'settings/team': { schema: S.team },
  'settings/api-keys': { schema: S.apikeys, actions: r => [{ label: 'Copy key', onClick: () => copy2(r.key) }, ...(r.status === 'Active' ? [{ label: 'Revoke', danger: true, onClick: () => run(db.update('apikeys', r.id, { status: 'Revoked', revokedAt: now() }), 'Key revoked') }] : [])] },
}
function copy2(t: string) { void navigator.clipboard?.writeText(t); toast.success('Copied to clipboard') }

export const crudPage = (k: string) => function CrudPage() { return <Crud cfg={PANEL_CRUD[k]} /> }
export const dealsCfg: CrudConfig = { schema: S.deals, List: ({ rows, ctx }) => <Board rows={rows} ctx={ctx} /> }
