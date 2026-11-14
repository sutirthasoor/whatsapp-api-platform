import { NextResponse } from 'next/server'
import { accounts } from '@/lib/server/store'
import { hashPassword, verifyPassword } from '@/lib/server/passwords'
import { getSession } from '@/lib/server/session'
export async function POST(req: Request) {
  const s = await getSession(); if (!s) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const { current, next } = await req.json().catch(() => ({}))
  if (!verifyPassword(String(current ?? ''), s.account.passwordHash)) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  if (String(next ?? '').length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  await accounts.update(s.account.id, { passwordHash: hashPassword(String(next)) })
  return NextResponse.json({ ok: true })
}
