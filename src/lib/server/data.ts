import 'server-only'
import { NextResponse } from 'next/server'
import { POLICY } from '@/lib/platform/collections'
import { accounts, nowIso, randomTokenSafe, rows, type Row } from './store'
import { hashPassword } from './passwords'
import { getSession, type Session } from './session'

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status })
export const err = (message: string, status = 400) => NextResponse.json({ error: message }, { status })

export async function needSession(role?: 'admin' | 'customer'): Promise<Session | NextResponse> {
  const s = await getSession()
  if (!s) return err('Not signed in', 401)
  if (role && s.role !== role) return err('Forbidden', 403)
  return s
}
export const isErr = (x: unknown): x is NextResponse => x instanceof NextResponse

const scopeOf = (s: Session) => `org:${s.orgId}`
const clean = (a: Row) => { const { passwordHash, password, ...rest } = a; return rest }
const isViewer = (s: Session) => s.role === 'customer' && s.teamRole === 'Viewer'
const canManageTeam = (s: Session) => s.role === 'customer' && ['Owner', 'Admin'].includes(s.teamRole ?? 'Owner')

type Op = 'list' | 'create' | 'update' | 'remove'

/** Single entry-point enforcing access rules for every collection. */
export async function dataOp(op: Op, c: string, s: Session, id?: string, body: Row = {}): Promise<NextResponse> {
  const write = op !== 'list'
  if (write && isViewer(s)) return err('Your role is read-only', 403)
  delete body.id; delete body.passwordHash

  // ----- accounts-backed virtual collections
  if (c === 'users' || c === 'team') {
    if (c === 'users' ? s.role !== 'admin' : !canManageTeam(s) && write) return err('Forbidden', 403)
    if (c === 'team' && s.role !== 'customer') return err('Forbidden', 403)
    const all = (await accounts.all()).filter(a => (c === 'users' ? true : a.orgId === s.orgId))
    if (op === 'list') return json({ rows: all.map(clean) })
    if (op === 'create') {
      const email = String(body.email ?? '').trim().toLowerCase(), pw = String(body.password ?? '')
      if (!email || !body.name) return err('Name and email are required')
      if (pw.length < 8) return err('Password must be at least 8 characters')
      if (await accounts.byEmail(email)) return err('An account with this email already exists', 409)
      const base: Row = c === 'team'
        ? { role: 'customer', orgId: s.orgId, teamRole: body.teamRole === 'Owner' ? 'Agent' : body.teamRole ?? 'Agent', company: s.account.company }
        : { role: body.accountType === 'Admin' ? 'admin' : 'customer', orgId: '', teamRole: 'Owner' }
      const { password, ...rest } = body
      const row = await accounts.create({ ...rest, ...base, email, passwordHash: hashPassword(pw) })
      if (c === 'users' && base.role === 'customer') await accounts.update(row.id, { orgId: row.id })
      return json({ row: clean((await accounts.byId(row.id))!) }, 201)
    }
    const target = all.find(a => a.id === id)
    if (!target) return err('Not found', 404)
    if (op === 'remove') {
      if (target.id === s.id || target.id === s.account.id) return err('You cannot delete your own account')
      if (c === 'team' && target.teamRole === 'Owner') return err('The owner cannot be removed')
      await accounts.remove(target.id); return json({ ok: true })
    }
    const patch: Row = { ...body }
    if (patch.password) { if (String(patch.password).length < 8) return err('Password must be at least 8 characters'); patch.passwordHash = hashPassword(String(patch.password)) }
    delete patch.password
    if (patch.email) { patch.email = String(patch.email).toLowerCase(); const ex = await accounts.byEmail(patch.email); if (ex && ex.id !== target.id) return err('Email already in use', 409) }
    if (c === 'users') { delete patch.role; delete patch.orgId; if (target.id === s.id) delete patch.status }
    if (c === 'team') { delete patch.role; delete patch.orgId; if (target.teamRole === 'Owner') { delete patch.teamRole; delete patch.status } }
    return json({ row: clean((await accounts.update(target.id, patch))!) })
  }

  // ----- computed usage (admin, read-only)
  if (c === 'usage') {
    if (s.role !== 'admin') return err('Forbidden', 403)
    if (write) return err('Usage is computed automatically', 405)
    const plans = await rows.list('global', 'plans')
    const out: Row[] = []
    for (const a of (await accounts.all()).filter(a => a.role === 'customer' && a.teamRole === 'Owner')) {
      const sc = `org:${a.orgId}`
      const [conv, leads, cust, media, team] = await Promise.all([rows.list(sc, 'conversations'), rows.list(sc, 'leads'), rows.list(sc, 'customers'), rows.list(sc, 'media'), accounts.all()])
      const plan = plans.find(p => p.name === a.plan) ?? plans[0]
      out.push({
        id: a.id, user: a.name, email: a.email, company: a.company, plan: a.plan ?? '—', period: new Date().toISOString().slice(0, 7),
        messages: conv.reduce((n, x) => n + (x.messages?.length ?? 0), 0), messagesLimit: plan?.messages ?? 0,
        contacts: leads.length + cust.length, contactsLimit: plan?.contacts ?? 0,
        storageGb: +(media.reduce((n, m) => n + (m.sizeBytes ?? 0), 0) / 1073741824).toFixed(3), storageLimit: plan?.storageGb ?? 0,
        seats: team.filter(t => t.orgId === a.orgId).length, seatsLimit: plan?.seats ?? 0, conversations: conv.length, status: a.status,
      })
    }
    return json({ rows: out })
  }

  const p = POLICY[c]
  if (!p) return err('Unknown collection', 404)

  // ----- permission by kind
  let scope: string, ownFilter = false
  if (p.kind === 'org') { if (s.role !== 'customer') return err('Forbidden', 403); scope = scopeOf(s) }
  else if (p.kind === 'platform') {
    scope = 'global'
    if (s.role !== 'admin' && !(p.customer === 'r' && !write)) return err('Forbidden', 403)
  } else {
    scope = 'global'
    if (s.role === 'customer') { ownFilter = true; if (write && p.customer !== 'rw') return err('Forbidden', 403) }
  }
  const ownerKey = s.orgId
  const mine = (r: Row) => !ownFilter || r.ownerId === ownerKey

  if (op === 'list') return json({ rows: (await rows.list(scope, c)).filter(mine) })
  if (op === 'create') {
    const row: Row = { ...body }
    if (p.doc) { const ex = (await rows.list(scope, c))[0]; if (ex) return json({ row: await rows.update(scope, c, ex.id, row) }) ; row.id = 'main' }
    if (ownFilter || c === 'tickets') { row.ownerId = ownerKey; row.user = s.account.name; row.userEmail = s.email }
    if (c === 'tickets') { row.created = nowIso(); row.replies = [{ by: s.account.name, text: row.description || row.subject, at: nowIso(), staff: false }]; row.status = 'Open' }
    if (c === 'apikeys') { row.key = 'wc_live_' + randomTokenSafe(20); row.created = nowIso(); row.status = row.status || 'Active' }
    if (c === 'gateways' && row.isDefault) for (const g of await rows.list('global', 'gateways')) await rows.update('global', 'gateways', g.id, { isDefault: false })
    row.createdAt ??= nowIso()
    return json({ row: await rows.create(scope, c, row) }, 201)
  }
  const cur = (await rows.list(scope, c)).find(r => r.id === id)
  if (!cur || !mine(cur)) return err('Not found', 404)
  if (op === 'remove') { await rows.remove(scope, c, id!); return json({ ok: true }) }
  if (c === 'gateways' && body.isDefault) for (const g of await rows.list('global', 'gateways')) if (g.id !== id) await rows.update('global', 'gateways', g.id, { isDefault: false })
  if (ownFilter) { delete body.ownerId; delete body.user }
  body.updatedAt = nowIso()
  return json({ row: await rows.update(scope, c, id!, body) })
}
