import { NextResponse } from 'next/server'
import { accounts, rows, nowIso } from '@/lib/server/store'
import { hashPassword } from '@/lib/server/passwords'
import { createSessionCookie, homeFor } from '@/lib/server/session'
import { rateLimit } from '@/lib/server/ratelimit'

const bad = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s })
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}))
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'
  if (!rateLimit(`signup:${ip}`, 5, 600_000)) return bad('Too many sign-ups from this network. Try later.', 429)
  const email = String(b.email ?? '').trim().toLowerCase(), name = String(b.name ?? '').trim(), pw = String(b.password ?? '')
  if (!name) return bad('Your name is required')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad('Enter a valid email address')
  if (pw.length < 8) return bad('Password must be at least 8 characters')
  if (await accounts.byEmail(email)) return bad('An account with this email already exists', 409)
  const plans = await rows.list('global', 'plans')
  const plan = plans.find(p => p.name === b.plan) ?? plans[0]
  const trialDays = plan?.trialDays ?? 14
  const acc = await accounts.create({ role: 'customer', teamRole: 'Owner', accountType: 'Customer', name, email, phone: b.phone ?? '', company: b.company ?? '', passwordHash: hashPassword(pw), plan: plan?.name ?? '', status: 'Trial', trialEnds: new Date(Date.now() + trialDays * 864e5).toISOString().slice(0, 10), source: 'Self sign-up' })
  await accounts.update(acc.id, { orgId: acc.id })
  await rows.create('org:' + acc.id, 'settings', { id: 'main', name, email, phone: b.phone ?? '', business: b.company ?? '', currency: 'INR', timezone: 'Asia/Kolkata', language: 'English', plan: plan?.name ?? '', cycle: 'Monthly', notifyNew: true, notifyAssign: true, notifyPayment: true, notifyDigest: false, createdAt: nowIso() })
  if (plan) await rows.create('global', 'subscriptions', { ownerId: acc.id, user: name, userEmail: email, plan: plan.name, cycle: 'Monthly', amount: 0, status: 'Trialing', started: nowIso().slice(0, 10), renewsOn: new Date(Date.now() + trialDays * 864e5).toISOString().slice(0, 10), source: 'Free trial' })
  const c = await createSessionCookie(acc.id)
  const res = NextResponse.json({ ok: true, role: 'customer', redirect: homeFor('customer') })
  res.cookies.set(c.name, c.value, c.options)
  return res
}
