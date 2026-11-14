'use client'
import { useEffect, useSyncExternalStore } from 'react'

export type Row = { id: string; [k: string]: any }

/** Thin fetch wrapper for /api/platform/*. Throws Error(message) on failure. */
export async function api<T = any>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  const r = await fetch('/api/platform/' + path, { method, credentials: 'same-origin', headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (r.status === 401 && typeof window !== 'undefined') window.location.href = '/login'
  if (!r.ok) throw new Error(j.error ?? `Request failed (${r.status})`)
  return j as T
}

const cache = new Map<string, Row[]>()
const pending = new Map<string, Promise<void>>()
const failed = new Map<string, string>()
const listeners = new Set<() => void>()
const EMPTY: Row[] = []
const emit = () => listeners.forEach(l => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

function load(c: string, force = false): Promise<void> {
  let p = pending.get(c)
  if (!p || force) {
    p = api<{ rows: Row[] }>(`data/${c}`).then(j => { cache.set(c, j.rows); failed.delete(c); emit() }).catch(e => { failed.set(c, e.message); cache.set(c, cache.get(c) ?? EMPTY); emit() })
    pending.set(c, p)
  }
  return p
}
const put = (c: string, rows: Row[]) => { cache.set(c, rows); emit() }

export const db = {
  async all(c: string) { await load(c); return cache.get(c) ?? EMPTY },
  refresh: (c: string) => load(c, true),
  async create(c: string, data: Partial<Row>) { const { row } = await api<{ row: Row }>(`data/${c}`, data); await load(c); put(c, [row, ...(cache.get(c) ?? []).filter(r => r.id !== row.id)]); return row },
  async update(c: string, id: string, patch: Partial<Row>) { const { row } = await api<{ row: Row }>(`data/${c}/${id}`, patch, 'PATCH'); put(c, (cache.get(c) ?? []).map(r => (r.id === id ? row : r))); return row },
  async remove(c: string, id: string) { await api(`data/${c}/${id}`, undefined, 'DELETE'); put(c, (cache.get(c) ?? []).filter(r => r.id !== id)) },
  reset() { cache.clear(); pending.clear(); failed.clear(); emit() },
}

export function useCollection(c: string, pollMs = 0) {
  useEffect(() => { void load(c); if (!pollMs) return; const t = setInterval(() => void load(c, true), pollMs); return () => clearInterval(t) }, [c, pollMs])
  const rows = useSyncExternalStore(subscribe, () => cache.get(c) ?? EMPTY, () => EMPTY)
  const ready = useSyncExternalStore(subscribe, () => cache.has(c), () => false)
  const error = useSyncExternalStore(subscribe, () => failed.get(c) ?? '', () => '')
  return { rows, ready, error }
}

/** Single-document collections (settings, WhatsApp API, AI config, site theme). */
export function useDoc(c: string): { doc: Row; ready: boolean; save: (p: Partial<Row>) => Promise<void> } {
  const { rows, ready } = useCollection(c)
  const row = rows[0]
  const save = async (p: Partial<Row>) => { if (row) await db.update(c, row.id, p); else await db.create(c, p) }
  return { doc: row ?? { id: 'main' }, ready, save }
}
