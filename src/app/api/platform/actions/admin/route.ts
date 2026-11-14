import { err, isErr, json, needSession } from '@/lib/server/data'
import { accounts, nowIso, rows } from '@/lib/server/store'
import { hashPassword, randomToken } from '@/lib/server/passwords'
import { activate, type Intent } from '@/lib/server/pay'

export async function POST(req: Request) {
  const s = await needSession('admin'); if (isErr(s)) return s
  const b = await req.json().catch(() => ({}))
  if (b.op === 'payment-paid') {                           // verify an offline payment → activate plan
    const p = (await rows.list('global', 'payments')).find(x => x.id === b.id); if (!p) return err('Payment not found', 404)
    await rows.update('global', 'payments', p.id, { status: 'Paid', verifiedBy: s.name, verifiedAt: nowIso() })
    const i = (await rows.list('global', 'payment_intents')).find(x => x.id === p.intentId) as Intent | undefined
    if (i) { await activate(i); await rows.update('global', 'payment_intents', i.id, { status: 'Paid' }) }
    return json({ ok: true })
  }
  if (b.op === 'renew') {
    const sub = (await rows.list('global', 'subscriptions')).find(x => x.id === b.id); if (!sub) return err('Subscription not found', 404)
    const next = new Date(+new Date(sub.renewsOn || Date.now()) + (sub.cycle === 'Yearly' ? 365 : 30) * 864e5).toISOString().slice(0, 10)
    await rows.update('global', 'subscriptions', sub.id, { status: 'Active', renewsOn: next, lastRenewedAt: nowIso() })
    await rows.create('global', 'payments', { ref: 'REN-' + randomToken(3).toUpperCase(), ownerId: sub.ownerId, user: sub.user, plan: sub.plan, cycle: sub.cycle, amount: sub.amount, currency: 'INR', method: 'Manual', gateway: 'Admin renewal', status: 'Paid', date: nowIso().slice(0, 10), createdAt: nowIso() })
    if (sub.ownerId) await accounts.update(sub.ownerId, { plan: sub.plan, status: 'Active' })
    return json({ ok: true, renewsOn: next })
  }
  if (b.op === 'enquiry-convert') {                         // creates a trial customer with a one-time password
    const e = (await rows.list('global', 'enquiries')).find(x => x.id === b.id); if (!e) return err('Enquiry not found', 404)
    if (!e.email) return err('This enquiry has no email address')
    if (await accounts.byEmail(e.email)) return err('A user with this email already exists', 409)
    const pw = randomToken(5)
    const acc = await accounts.create({ role: 'customer', teamRole: 'Owner', accountType: 'Customer', name: e.name, email: e.email, phone: e.phone, company: e.company ?? '', plan: e.interest, status: 'Trial', passwordHash: hashPassword(pw), source: 'Enquiry' })
    await accounts.update(acc.id, { orgId: acc.id })
    await rows.create('org:' + acc.id, 'settings', { id: 'main', name: e.name, email: e.email, phone: e.phone, business: e.company ?? '', plan: e.interest, currency: 'INR', timezone: 'Asia/Kolkata' })
    await rows.update('global', 'enquiries', e.id, { status: 'Closed', convertedTo: acc.id })
    return json({ ok: true, email: e.email, password: pw })
  }
  if (b.op === 'ticket-reply') {
    const t = (await rows.list('global', 'tickets')).find(x => x.id === b.id); if (!t) return err('Ticket not found', 404)
    await rows.update('global', 'tickets', t.id, { replies: [...(t.replies ?? []), { by: 'Support', text: String(b.text), at: nowIso(), staff: true }], status: t.status === 'Open' ? 'In progress' : t.status, lastReplyAt: nowIso() })
    return json({ ok: true })
  }
  return err('Unknown action')
}
