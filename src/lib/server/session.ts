import 'server-only'
import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { accounts, sessionSecret, type Row } from './store'

export const COOKIE = 'wc_session'
const TTL = 60 * 60 * 24 * 14 // 14 days

export interface Session { id: string; role: 'admin' | 'customer'; orgId: string; name: string; email: string; teamRole?: string; imp?: string; account: Row }

const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url')
async function sign(payload: object) {
  const body = b64(JSON.stringify(payload))
  const mac = crypto.createHmac('sha256', await sessionSecret()).update(body).digest('base64url')
  return `${body}.${mac}`
}
async function verify(token: string): Promise<any | null> {
  const [body, mac] = token.split('.')
  if (!body || !mac) return null
  const good = crypto.createHmac('sha256', await sessionSecret()).update(body).digest('base64url')
  const a = Buffer.from(mac), b = Buffer.from(good)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() / 1000 ? p : null } catch { return null }
}

export async function createSessionCookie(accountId: string, imp?: string) {
  const token = await sign({ sub: accountId, imp, exp: Math.floor(Date.now() / 1000) + TTL })
  return { name: COOKIE, value: token, options: { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: TTL } }
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const p = await verify(token)
  if (!p) return null
  const a = await accounts.byId(p.sub)
  if (!a || a.status === 'Suspended') return null
  return { id: a.id, role: a.role, orgId: a.orgId, name: a.name, email: a.email, teamRole: a.teamRole, imp: p.imp, account: a }
}

export const homeFor = (role: string) => (role === 'admin' ? '/admin/dashboard' : '/panel/dashboard')
