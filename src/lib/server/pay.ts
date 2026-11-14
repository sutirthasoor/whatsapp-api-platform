import 'server-only'
import crypto from 'node:crypto'
import { accounts, nowIso, rows, type Row } from './store'

export interface Intent { id: string; ownerId: string; planId: string; plan: string; cycle: 'Monthly' | 'Yearly'; amount: number; gatewayId: string; provider: string; orderId?: string; status: string }

export async function publicOptions() {
  return (await rows.list('global', 'gateways')).filter(g => g.enabled).map(g => ({ id: g.id, name: g.name, provider: g.provider, mode: g.mode, isDefault: !!g.isDefault, instructions: g.instructions ?? '', methods: g.supportedMethods ?? '' }))
}
export const priceOf = (plan: Row, cycle: string) => Math.round((cycle === 'Yearly' ? plan.priceYearly : plan.priceMonthly) * (1 + (Number(plan.taxPercent) || 0) / 100) * 100) / 100

export async function createIntent(ownerId: string, planId: string, cycle: 'Monthly' | 'Yearly', gatewayId: string, origin: string) {
  const plan = (await rows.list('global', 'plans')).find(p => p.id === planId && p.status === 'Active')
  const gw = (await rows.list('global', 'gateways')).find(g => g.id === gatewayId && g.enabled)
  if (!plan) throw new Error('Plan not available'); if (!gw) throw new Error('Payment gateway not available')
  const amount = priceOf(plan, cycle)
  const base: Intent = { id: 'int_' + crypto.randomBytes(6).toString('hex'), ownerId, planId, plan: plan.name, cycle, amount, gatewayId, provider: gw.provider, status: 'Created' }
  let extra: Row = {}
  if (gw.provider === 'razorpay') {
    if (!gw.keyId || !gw.secret) throw new Error('Razorpay keys are not configured by the admin')
    const r = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(`${gw.keyId}:${gw.secret}`).toString('base64'), 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Math.round(amount * 100), currency: gw.currency || 'INR', receipt: base.id, notes: { plan: plan.name, cycle, ownerId } }) })
    const j: any = await r.json(); if (!r.ok) throw new Error(j?.error?.description ?? 'Razorpay order failed')
    base.orderId = j.id; extra = { keyId: gw.keyId, orderId: j.id, amount: j.amount, currency: j.currency }
  } else if (gw.provider === 'stripe') {
    if (!gw.secret) throw new Error('Stripe secret key is not configured by the admin')
    const f = new URLSearchParams({ mode: 'payment', 'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': (gw.currency || 'INR').toLowerCase(), 'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)), 'line_items[0][price_data][product_data][name]': `${plan.name} plan (${cycle})`, success_url: `${origin}/panel/settings/billing?paid={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/panel/settings/billing?cancelled=1`, client_reference_id: base.id })
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${gw.secret}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: f })
    const j: any = await r.json(); if (!r.ok) throw new Error(j?.error?.message ?? 'Stripe session failed')
    base.orderId = j.id; extra = { url: j.url }
  }
  await rows.create('global', 'payment_intents', base)
  if (gw.provider === 'offline') {
    await recordPayment(base, 'Pending', `OFF-${base.id.slice(-6).toUpperCase()}`, 'Bank Transfer', gw.name)
    return { ...base, offline: true, instructions: gw.instructions ?? '' }
  }
  return { ...base, ...extra }
}

export async function recordPayment(i: Intent, status: 'Paid' | 'Pending' | 'Failed', ref: string, method: string, gatewayName: string, gatewayPaymentId = '') {
  const acc = await accounts.byId(i.ownerId)
  await rows.create('global', 'payments', { ref, ownerId: i.ownerId, user: acc?.name, userEmail: acc?.email, plan: i.plan, cycle: i.cycle, amount: i.amount, currency: 'INR', method, gateway: gatewayName, gatewayOrderId: i.orderId ?? '', gatewayPaymentId, status, date: nowIso().slice(0, 10), createdAt: nowIso(), intentId: i.id })
  if (status === 'Paid') await activate(i)
}
/** Cancel older subscriptions and activate the purchased plan. */
export async function activate(i: Intent) {
  for (const s of await rows.list('global', 'subscriptions')) if (s.ownerId === i.ownerId && ['Active', 'Trialing', 'Pending'].includes(s.status)) await rows.update('global', 'subscriptions', s.id, { status: 'Cancelled' })
  const acc = await accounts.byId(i.ownerId)
  await rows.create('global', 'subscriptions', { ownerId: i.ownerId, user: acc?.name, userEmail: acc?.email, plan: i.plan, cycle: i.cycle, amount: i.amount, status: 'Active', started: nowIso().slice(0, 10), renewsOn: new Date(Date.now() + (i.cycle === 'Yearly' ? 365 : 30) * 864e5).toISOString().slice(0, 10), autoRenew: true, source: 'Checkout' })
  await accounts.update(i.ownerId, { plan: i.plan, status: 'Active' })
  await rows.upsert(`org:${i.ownerId}`, 'settings', 'main', { plan: i.plan, cycle: i.cycle })
}

export async function verifyPayment(ownerId: string, body: Row) {
  const intent = (await rows.list('global', 'payment_intents')).find(x => (x.id === body.intentId || x.orderId === body.orderId) && x.ownerId === ownerId) as Intent | undefined
  if (!intent) throw new Error('Payment not found')
  if (intent.status === 'Paid') return intent
  const gw = (await rows.list('global', 'gateways')).find(g => g.id === intent.gatewayId)!
  if (intent.provider === 'razorpay') {
    const sig = crypto.createHmac('sha256', gw.secret).update(`${intent.orderId}|${body.paymentId}`).digest('hex')
    if (sig !== body.signature) { await recordPayment(intent, 'Failed', String(body.paymentId ?? 'RZP'), 'Razorpay', gw.name); throw new Error('Signature verification failed') }
    await recordPayment(intent, 'Paid', String(body.paymentId), 'Razorpay', gw.name, String(body.paymentId))
  } else if (intent.provider === 'stripe') {
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${intent.orderId}`, { headers: { Authorization: `Bearer ${gw.secret}` } })
    const j: any = await r.json()
    if (!r.ok || j.payment_status !== 'paid') throw new Error('Stripe has not confirmed this payment yet')
    await recordPayment(intent, 'Paid', String(j.payment_intent ?? j.id), 'Card', gw.name, String(j.payment_intent ?? ''))
  } else throw new Error('Nothing to verify for this gateway')
  await rows.update('global', 'payment_intents', intent.id, { status: 'Paid' })
  return { ...intent, status: 'Paid' }
}
