import { NextResponse } from 'next/server'
import { accounts } from '@/lib/server/store'
import { verifyPassword } from '@/lib/server/passwords'
import { createSessionCookie, homeFor } from '@/lib/server/session'
import { rateLimit } from '@/lib/server/ratelimit'

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}))
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'
  if (!rateLimit(`login:${ip}:${String(email).toLowerCase()}`, 8, 60_000)) return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 })
  const a = email ? await accounts.byEmail(String(email)) : undefined
  if (!a || !verifyPassword(String(password ?? ''), a.passwordHash)) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  if (a.status === 'Suspended') return NextResponse.json({ error: 'This account is suspended. Contact support.' }, { status: 403 })
  await accounts.update(a.id, { lastLogin: new Date().toISOString() })
  const c = await createSessionCookie(a.id)
  const res = NextResponse.json({ ok: true, role: a.role, redirect: homeFor(a.role) })
  res.cookies.set(c.name, c.value, c.options)
  return res
}
