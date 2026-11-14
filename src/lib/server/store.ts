import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { hashPassword, randomToken } from './passwords'
import { SEED_PLANS, SEED_GATEWAYS } from '@/lib/platform/seed'

/**
 * Persistent server-side store (single JSON file, atomic writes, serialized
 * mutations). Zero external services needed. To move to Postgres/Supabase,
 * re-implement the functions exported from this file — nothing else touches
 * the file directly.
 */
export type Row = { id: string; [k: string]: any }
interface DB { meta: { secret: string; version: number }; accounts: Row[]; data: Record<string, Row[]> }

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data')
const FILE = path.join(DATA_DIR, 'db.json')
let cache: DB | null = null
let chain: Promise<unknown> = Promise.resolve()

export const randomTokenSafe = (n = 12) => randomToken(n)
export const uid = (p: string) => `${p}_${Date.now().toString(36)}${randomToken(3)}`
export const nowIso = () => new Date().toISOString()

function accountDefaults(a: Row): Row {
  return { createdAt: nowIso(), lastLogin: '', status: 'Active', ...a }
}

function initialDb(): DB {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@whatscrm.app').toLowerCase()
  let adminPass = process.env.ADMIN_PASSWORD
  if (!adminPass) {
    adminPass = process.env.NODE_ENV === 'production' ? randomToken(8) : 'Admin@12345'
    console.warn(`[whatscrm] ADMIN_PASSWORD not set. Initial admin login → ${adminEmail} / ${adminPass}  (change it in Settings → Security)`)
  }
  const accounts: Row[] = [accountDefaults({
    id: 'acc_admin', role: 'admin', orgId: 'org_admin', name: 'Platform Admin', email: adminEmail, passwordHash: hashPassword(adminPass),
    accountType: 'Admin', company: 'WhatsCRM',
  })]
  if (process.env.NODE_ENV !== 'production' || process.env.SEED_CUSTOMER === 'true') {
    const pass = process.env.CUSTOMER_PASSWORD || 'Customer@12345'
    accounts.push(accountDefaults({
      id: 'acc_owner', role: 'customer', orgId: 'acc_owner', teamRole: 'Owner', name: 'Store Owner', email: (process.env.CUSTOMER_EMAIL || 'customer@whatscrm.app').toLowerCase(),
      passwordHash: hashPassword(pass), accountType: 'Customer', company: 'My Business', plan: 'Unified', trialEnds: '',
    }))
    console.warn(`[whatscrm] Dev customer login → ${(process.env.CUSTOMER_EMAIL || 'customer@whatscrm.app')} / ${pass}`)
  }
  return {
    meta: { secret: process.env.SESSION_SECRET || randomToken(32), version: 1 }, accounts,
    data: { 'global|plans': SEED_PLANS(), 'global|gateways': SEED_GATEWAYS(), 'global|siteTheme': [{ id: 'main', brand: 'WhatsCRM', primary: '#7c3aed', accent: '#22c55e' }] },
  }
}

async function load(): Promise<DB> {
  if (cache) return cache
  try { cache = JSON.parse(await fs.readFile(FILE, 'utf8')) as DB }
  catch { cache = initialDb(); await save(cache) }
  return cache!
}
async function save(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const tmp = FILE + '.' + process.pid + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(db), 'utf8')
  await fs.rename(tmp, FILE)
}
/** Run a mutation exclusively; persisted when it resolves. */
function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = chain.then(async () => { const db = await load(); const r = await fn(db); await save(db); return r })
  chain = run.catch(() => undefined)
  return run
}

export const sessionSecret = async () => (await load()).meta.secret
const key = (scope: string, c: string) => `${scope}|${c}`

// ------------------------------------------------------------------ accounts
export const accounts = {
  async all() { return (await load()).accounts },
  async byId(id: string) { return (await load()).accounts.find(a => a.id === id) },
  async byEmail(email: string) { const e = email.trim().toLowerCase(); return (await load()).accounts.find(a => a.email === e) },
  create(a: Partial<Row>) { return mutate(db => { const row = accountDefaults({ ...a, id: a.id ?? uid('acc'), email: String(a.email).trim().toLowerCase() }); db.accounts.unshift(row); return row }) },
  update(id: string, patch: Partial<Row>) { return mutate(db => { const i = db.accounts.findIndex(a => a.id === id); if (i < 0) return null; db.accounts[i] = { ...db.accounts[i], ...patch, id }; return db.accounts[i] }) },
  remove(id: string) { return mutate(db => { db.accounts = db.accounts.filter(a => a.id !== id) }) },
}

// ----------------------------------------------------------------- collections
export const rows = {
  async list(scope: string, c: string): Promise<Row[]> { return (await load()).data[key(scope, c)] ?? [] },
  create(scope: string, c: string, row: Partial<Row>) { return mutate(db => { const r = { ...row, id: row.id ?? uid(c.slice(0, 4)) } as Row; (db.data[key(scope, c)] ??= []).unshift(r); return r }) },
  update(scope: string, c: string, id: string, patch: Partial<Row>) { return mutate(db => { const l = (db.data[key(scope, c)] ??= []); const i = l.findIndex(r => r.id === id); if (i < 0) return null; l[i] = { ...l[i], ...patch, id }; return l[i] }) },
  upsert(scope: string, c: string, id: string, patch: Partial<Row>) { return mutate(db => { const l = (db.data[key(scope, c)] ??= []); const i = l.findIndex(r => r.id === id); if (i < 0) { const r = { ...patch, id } as Row; l.unshift(r); return r } l[i] = { ...l[i], ...patch, id }; return l[i] }) },
  remove(scope: string, c: string, id: string) { return mutate(db => { const k = key(scope, c); db.data[k] = (db.data[k] ?? []).filter(r => r.id !== id) }) },
  /** Atomic read-modify-write of one row (e.g. appending a chat message). */
  patchWith(scope: string, c: string, id: string, fn: (r: Row) => Partial<Row>) { return mutate(db => { const l = (db.data[key(scope, c)] ??= []); const i = l.findIndex(r => r.id === id); if (i < 0) return null; l[i] = { ...l[i], ...fn(l[i]), id }; return l[i] }) },
}
/** Find an org by a WhatsApp phone number id (used by the inbound webhook). */
export async function orgByPhoneNumberId(pnid: string) {
  const db = await load()
  for (const [k, v] of Object.entries(db.data)) if (k.endsWith('|waapi') && v[0]?.phoneNumberId === pnid) return k.split('|')[0].replace('org:', '')
  return null
}
export async function orgScopes() { return (await load()).accounts.filter(a => a.role === 'customer' && a.teamRole === 'Owner').map(a => a.orgId as string) }
