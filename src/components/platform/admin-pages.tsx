'use client'
import { useState } from 'react'
import { Download, CreditCard, HeartHandshake, MessageCircle, TrendingUp, Users, Workflow } from 'lucide-react'
import Link from 'next/link'
import { api, db, useCollection, type Row } from '@/lib/platform/client-store'
import { SCHEMAS } from '@/lib/platform/schemas'
import { Crud, DocForm, type CrudConfig } from './crud'
import { ticketCfg } from './panel-crud'
import { Badge, Btn, Card, CardHead, Empty, LinkBtn, PageHead, Progress, Screen, Stat, Stats, downloadCSV, fdate, fdt, inr, run } from './ui'

const S = SCHEMAS
const now = () => new Date().toISOString()
const Bar = ({ label, value, max, right }: { label: string; value: number; max: number; right?: string }) => <div className="mb-2"><div className="mb-1 flex justify-between text-xs"><span>{label}</span><span className="text-muted-foreground">{right ?? value}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (value / (max || 1)) * 100)}%` }} /></div></div>

export function AdminDashboard() {
  const U = useCollection('users').rows, SU = useCollection('subscriptions').rows, P = useCollection('payments').rows, T = useCollection('tickets').rows, E = useCollection('enquiries').rows
  const customers = U.filter(u => u.accountType !== 'Admin')
  const paid = P.filter(p => p.status === 'Paid'), revenue = paid.reduce((a, p) => a + (+p.amount || 0), 0)
  const mrr = SU.filter(s => s.status === 'Active').reduce((a, s) => a + (s.cycle === 'Yearly' ? s.amount / 12 : +s.amount || 0), 0)
  const months: Record<string, number> = {}; paid.forEach(p => { const m = String(p.date ?? '').slice(0, 7); if (m) months[m] = (months[m] || 0) + (+p.amount || 0) })
  const ms = Object.entries(months).sort().slice(-6), mx = Math.max(1, ...ms.map(x => x[1]))
  const byPlan: Record<string, number> = {}; SU.filter(s => ['Active', 'Trialing'].includes(s.status)).forEach(s => { byPlan[s.plan] = (byPlan[s.plan] || 0) + 1 })
  return <div><PageHead title="Platform overview" description="Customers, revenue and support at a glance." />
    <Stats><Stat label="Customers" value={customers.length} hint={`${customers.filter(u => u.status === 'Trial').length} on trial`} icon={Users} /><Stat label="Monthly recurring" value={inr(mrr)} hint={`${SU.filter(s => s.status === 'Active').length} active subscriptions`} icon={TrendingUp} />
      <Stat label="Revenue collected" value={inr(revenue)} hint={`${P.filter(p => p.status === 'Pending').length} payments awaiting verification`} icon={CreditCard} /><Stat label="Open tickets" value={T.filter(t => ['Open', 'In progress'].includes(t.status)).length} hint={`${E.filter(e => e.status === 'New').length} new enquiries`} icon={HeartHandshake} /></Stats>
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHead title="Revenue by month" /><div className="p-4">{ms.length ? ms.map(([m, v]) => <Bar key={m} label={m} value={v} max={mx} right={inr(v)} />) : <Empty>No payments yet.</Empty>}</div></Card>
      <Card><CardHead title="Subscribers by plan" /><div className="p-4">{Object.keys(byPlan).length ? Object.entries(byPlan).map(([k, v]) => <Bar key={k} label={k} value={v} max={Math.max(...Object.values(byPlan))} />) : <Empty>No subscribers yet.</Empty>}</div></Card>
      <Card><CardHead title="Newest customers" action={<Link href="/admin/users" className="text-xs text-primary">All</Link>} /><ul className="divide-y divide-border">{customers.slice(0, 5).map(u => <li key={u.id}><Link href={`/admin/users/${u.id}`} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-card-2"><span className="truncate">{u.name}<span className="block text-xs text-muted-foreground">{u.email}</span></span><Badge>{u.status}</Badge></Link></li>)}{!customers.length && <Empty>None yet.</Empty>}</ul></Card>
      <Card><CardHead title="Recent enquiries" action={<Link href="/admin/enquiries" className="text-xs text-primary">All</Link>} /><ul className="divide-y divide-border">{E.slice(0, 5).map(e => <li key={e.id}><Link href={`/admin/enquiries/${e.id}`} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-card-2"><span className="truncate">{e.name}<span className="block text-xs text-muted-foreground">{e.interest}</span></span><Badge>{e.status}</Badge></Link></li>)}{!E.length && <Empty>None yet.</Empty>}</ul></Card>
      <Card><CardHead title="Support queue" action={<Link href="/admin/support" className="text-xs text-primary">All</Link>} /><ul className="divide-y divide-border">{T.filter(t => !['Resolved', 'Closed'].includes(t.status)).slice(0, 5).map(t => <li key={t.id}><Link href={`/admin/support/${t.id}`} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-card-2"><span className="truncate">{t.subject}</span><Badge>{t.priority}</Badge></Link></li>)}{!T.some(t => !['Resolved', 'Closed'].includes(t.status)) && <Empty>All clear.</Empty>}</ul></Card>
    </div></div>
}

/* ───────── configs ───────── */
const refresh = (c: string) => db.refresh(c)
const cfgs: Record<string, CrudConfig> = {
  users: { schema: S.users, actions: r => [
    ...(r.accountType !== 'Admin' ? [{ label: 'Open workspace as user', onClick: async () => { await run(async () => { const j = await api<{ redirect: string }>('auth/impersonate', { id: r.id }); window.location.href = j.redirect }) } }] : []),
    r.status === 'Suspended' ? { label: 'Reactivate', onClick: () => run(db.update('users', r.id, { status: 'Active' }), 'Account reactivated') } : { label: 'Suspend', danger: true, onClick: () => run(db.update('users', r.id, { status: 'Suspended' }), 'Account suspended') }] },
  payments: { schema: S.payments, noCreate: true, actions: r => r.status === 'Pending' ? [{ label: 'Mark as paid & activate plan', onClick: async () => { await run(api('actions/admin', { op: 'payment-paid', id: r.id }), 'Payment verified — plan activated'); await Promise.all([refresh('payments'), refresh('subscriptions')]) } }] : [] },
  plans: { schema: S.plans },
  subscriptions: { schema: S.subscriptions, noCreate: true, actions: r => [{ label: 'Renew now', onClick: async () => { await run(api('actions/admin', { op: 'renew', id: r.id }), 'Subscription renewed'); await Promise.all([refresh('subscriptions'), refresh('payments')]) } }] },
  gateways: { schema: S.gateways, actions: r => r.isDefault ? [] : [{ label: 'Make default', onClick: async () => { await run(db.update('gateways', r.id, { isDefault: true, enabled: true }), 'Default gateway updated'); await refresh('gateways') } }],
    Detail: ({ row }) => <Card><CardHead title="Webhook" /><p className="p-4 text-xs text-muted-foreground">Point {row.name} webhooks to <code>{typeof window === 'undefined' ? '' : location.origin}/api/platform/pay</code> if your provider requires one. Payments are also confirmed by the customer’s browser through signature verification.</p></Card> },
  enquiries: { schema: S.enquiries, actions: r => r.convertedTo ? [] : [{ label: 'Convert to customer', href: `/admin/enquiries/${r.id}/convert` }],
    screens: { convert: ({ row }) => <Convert row={row} /> } },
  support: { ...ticketCfg(true), noCreate: true },
  'main-site/credentials': { schema: S.site_credentials },
}
for (const p of ['flow', 'automation']) { const k = p === 'flow' ? 'flow' : 'auto'; cfgs[`${p}/users`] = { schema: S[`${k}_users`] }; cfgs[`${p}/organisation`] = { schema: S[`${k}_orgs`] }; cfgs[`${p}/training`] = { schema: S[`${k}_training`] }; cfgs[`${p}/credentials`] = { schema: S[`${k}_credentials`] } }
export const ADMIN_CRUD = cfgs
export const adminCrud = (k: string) => function AdminCrud() { return <Crud cfg={cfgs[k]} /> }

function Convert({ row }: { row: Row }) {
  const [r, setR] = useState<{ email: string; password: string } | null>(null), [busy, setBusy] = useState(false)
  return <Screen narrow back={`/admin/enquiries/${row.id}`} backLabel="Enquiry" title="Convert to customer" subtitle={`${row.name} · ${row.email || 'no email'}`}>
    <Card className="space-y-4 p-5 text-sm">{r ? <><p className="text-emerald-500">Customer account created.</p><div className="rounded-lg bg-card-2 p-3"><p>Login: <b>{r.email}</b></p><p>One-time password: <code className="font-semibold">{r.password}</code></p></div><p className="text-xs text-muted-foreground">Share this securely. It is not shown again — the customer can change it under Settings → Security.</p><LinkBtn href="/admin/users">Go to users</LinkBtn></>
      : <><p>This creates a trial workspace for <b>{row.name}</b>{row.interest ? <> on the <b>{row.interest}</b> plan</> : null} and closes the enquiry.</p>{!row.email && <p className="text-destructive">This enquiry has no email address, so it cannot be converted.</p>}
        <div className="flex gap-2"><Btn disabled={busy || !row.email} onClick={async () => { setBusy(true); await run(async () => { setR(await api('actions/admin', { op: 'enquiry-convert', id: row.id })); await Promise.all([refresh('enquiries'), refresh('users')]) }); setBusy(false) }}>{busy ? 'Creating…' : 'Create customer'}</Btn><LinkBtn href={`/admin/enquiries/${row.id}`} variant="outline">Cancel</LinkBtn></div></>}</Card></Screen>
}

export function BillingUsage() {
  const { rows, ready } = useCollection('usage')
  return <div><PageHead title="Billing & usage" description="Consumption per customer against plan limits, this month." actions={<Btn variant="outline" disabled={!rows.length} onClick={() => downloadCSV('usage', rows, ['user', 'email', 'plan', 'period', 'messages', 'messagesLimit', 'contacts', 'contactsLimit', 'storageGb', 'storageLimit', 'seats', 'seatsLimit'])}><Download size={14} />Export</Btn>} />
    <Card>{!ready ? <Empty>Loading…</Empty> : !rows.length ? <Empty>No customers yet.</Empty> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="px-4 py-2.5">Customer</th><th>Plan</th><th>Messages</th><th>Contacts</th><th>Storage (GB)</th><th>Seats</th><th>Status</th></tr></thead>
      <tbody>{rows.map(u => <tr key={u.id} className="border-b border-border last:border-0"><td className="px-4 py-2.5"><Link href={`/admin/users/${u.id}`} className="font-medium hover:text-primary">{u.user}</Link><span className="block text-xs text-muted-foreground">{u.company || u.email}</span></td><td><Badge>{u.plan}</Badge></td>
        <td><Progress value={u.messages} max={u.messagesLimit} /></td><td><Progress value={u.contacts} max={u.contactsLimit} /></td><td><Progress value={u.storageGb} max={u.storageLimit} /></td><td><Progress value={u.seats} max={u.seatsLimit} /></td><td><Badge>{u.status}</Badge></td></tr>)}</tbody></table></div>}</Card></div>
}

export function PlatformOverview({ p }: { p: 'flow' | 'automation' }) {
  const k = p === 'flow' ? 'flow' : 'auto', name = p === 'flow' ? 'Flow' : 'Automation'
  const u = useCollection(`${k}_users`).rows, o = useCollection(`${k}_orgs`).rows, t = useCollection(`${k}_training`).rows, c = useCollection(`${k}_credentials`).rows
  const base = `/admin/${p}`
  const tiles: [string, number, string, string][] = [['Users', u.length, `${u.filter(x => x.status === 'Active').length} active`, 'users'], ['Organisations', o.length, `${o.filter(x => x.status === 'Active').length} active`, 'organisation'], ['Training', t.length, `${t.reduce((a, x) => a + (+x.enrolled || 0), 0)} enrolled`, 'training'], ['Credentials', c.length, `${c.filter(x => x.status === 'Active').length} active`, 'credentials']]
  return <div><PageHead title={`${name} platform`} description={`Manage everything that runs on the ${name} platform.`} />
    <Stats>{tiles.map(([l, n, h]) => <Stat key={l} label={l} value={n} hint={h} icon={Workflow} />)}</Stats>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{tiles.map(([l, , , s]) => <LinkBtn key={l} href={`${base}/${s}`} variant="outline" className="h-12 justify-between px-4">{l}<span>→</span></LinkBtn>)}</div></div>
}
export const SiteTheming = () => <DocForm collection="siteTheme" title="Site theming" description="Brand, hero content, sections and SEO for the public main site." />
