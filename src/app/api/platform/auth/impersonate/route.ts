import { NextResponse } from 'next/server'
import { accounts } from '@/lib/server/store'
import { createSessionCookie, getSession } from '@/lib/server/session'

/** Admin → open a customer's panel as that customer. DELETE → return to admin. */
export async function POST(req: Request) {
  const s = await getSession(); if (!s || s.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json().catch(() => ({}))
  const t = await accounts.byId(String(id))
  if (!t || t.role !== 'customer') return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  const c = await createSessionCookie(t.id, s.id)
  const res = NextResponse.json({ ok: true, redirect: '/panel/dashboard' }); res.cookies.set(c.name, c.value, c.options); return res
}
export async function DELETE() {
  const s = await getSession(); if (!s?.imp) return NextResponse.json({ error: 'Not impersonating' }, { status: 400 })
  const c = await createSessionCookie(s.imp)
  const res = NextResponse.json({ ok: true, redirect: '/admin/users' }); res.cookies.set(c.name, c.value, c.options); return res
}
