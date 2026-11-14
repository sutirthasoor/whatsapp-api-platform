'use client'
import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { db, useCollection, useDoc, type Row } from '@/lib/platform/client-store'
import { computeTotals, type Line } from '@/lib/platform/calc'
import { SCHEMAS, DOCS } from '@/lib/platform/schemas'
import type { Field, Schema } from '@/lib/platform/schema-kit'
import { ActionBar, Badge, Btn, Card, Empty, Input, Label, LinkBtn, Menu, Screen, Select, SecretInput, Switch, Textarea, downloadCSV, fdate, fdt, inr, run } from './ui'
import { useRoute } from './route'

/* ───────────────────────── helpers ───────────────────────── */
export const prettify = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())
const parseCol = (c: string) => { const t = c.slice(-1); return '!$@#'.includes(t) ? { key: c.slice(0, -1), t } : { key: c, t: '' } }
export const fieldOf = (s: Schema, key: string): Field | undefined => s.sections.flatMap(x => x.fields).find(f => f.key === key)
const pad = (n: number) => String(n).padStart(2, '0')
const toLocalInput = (v: any) => { if (!v) return ''; const s = String(v); if (/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(s)) return s; const d = new Date(s); return isNaN(+d) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }
const textOf = (v: any) => (Array.isArray(v) ? (v.length && typeof v[0] === 'object' ? `${v.length} items` : v.join(', ')) : typeof v === 'object' && v ? JSON.stringify(v) : String(v ?? ''))

/** Renders one value according to its column / field type. */
export function Cell({ v, t, f }: { v: any; t?: string; f?: Field }) {
  if (v === undefined || v === null || v === '') return <span className="text-muted-foreground">—</span>
  if (t === '!') return <Badge>{String(v)}</Badge>
  if (t === '$') return <>{inr(v)}</>
  if (t === '@') return <>{fdate(v)}</>
  if (t === '#') return <>{fdt(v)}</>
  if (f?.type === 'switch' || typeof v === 'boolean') return <Badge tone={v ? 'good' : 'info'}>{v ? 'Yes' : 'No'}</Badge>
  if (f?.secret) return <code className="text-xs">••••••••</code>
  if (f?.type === 'url') return <a href={String(v)} target="_blank" rel="noreferrer" className="text-primary hover:underline">{String(v)}</a>
  if (f?.type === 'color') return <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded border border-border" style={{ background: String(v) }} />{String(v)}</span>
  if (f?.type === 'date') return <>{fdate(v)}</>
  if (f?.type === 'datetime-local') return <>{fdt(v)}</>
  const s = textOf(v)
  return <span title={s}>{s.length > 60 ? s.slice(0, 58) + '…' : s}</span>
}

/* ───────────────────────── config ───────────────────────── */
export interface RowAction { label: string; onClick?: () => unknown; href?: string; danger?: boolean }
export interface Ctx { base: string; go: (path: string) => void; reload: () => Promise<void> }
export interface CrudConfig {
  schema: Schema
  /** Extra per-row actions shown in the row menu and on the detail screen. */
  actions?: (row: Row, ctx: Ctx) => RowAction[]
  /** Extra full-screen routes below a record: `<base>/<id>/<name>`. */
  screens?: Record<string, (p: { row: Row; ctx: Ctx }) => ReactNode>
  /** Replaces the default table (e.g. a kanban board). Receives the loaded rows. */
  List?: (p: { rows: Row[]; ctx: Ctx; schema: Schema }) => ReactNode
  /** Extra content on the detail screen, under the field sections. */
  Detail?: (p: { row: Row; ctx: Ctx }) => ReactNode
  /** Header actions on the list screen. */
  listActions?: ReactNode
  noCreate?: boolean; noEdit?: boolean; noDelete?: boolean
  /** Extra default values for a new record (from the URL or the current user). */
  defaults?: Record<string, any>
  pageSize?: number
}

function useCtx(base: string, c: string): Ctx {
  const router = useRouter()
  return { base, go: p => router.push(p), reload: async () => { await db.refresh(c) } }
}

/* ───────────────────────── entry: routes of one collection ───────────────────────── */
export function Crud({ cfg }: { cfg: CrudConfig }) {
  const { base, sub } = useRoute()
  const { rows, ready, error } = useCollection(cfg.schema.collection)
  const ctx = useCtx(base, cfg.schema.collection)
  const [a, b] = sub
  if (a === 'new' && !cfg.noCreate) return <FormScreen cfg={cfg} ctx={ctx} />
  if (a) {
    if (!ready) return <Empty>Loading…</Empty>
    const row = rows.find(r => r.id === a)
    if (!row) return <Screen title="Not found" back={base}><Card className="p-6 text-sm text-muted-foreground">This {cfg.schema.singular.toLowerCase()} no longer exists.</Card></Screen>
    if (b === 'edit' && !cfg.noEdit) return <FormScreen cfg={cfg} ctx={ctx} row={row} />
    if (b === 'delete' && !cfg.noDelete) return <DeleteScreen cfg={cfg} ctx={ctx} row={row} />
    if (b && cfg.screens?.[b]) return <>{cfg.screens[b]({ row, ctx })}</>
    return <DetailScreen cfg={cfg} ctx={ctx} row={row} />
  }
  return <ListScreen cfg={cfg} ctx={ctx} rows={rows} ready={ready} error={error} />
}

/* ───────────────────────── list ───────────────────────── */
function ListScreen({ cfg, ctx, rows, ready, error }: { cfg: CrudConfig; ctx: Ctx; rows: Row[]; ready: boolean; error: string }) {
  const s = cfg.schema
  const router = useRouter()
  const [q, setQ] = useState(''), [flt, setFlt] = useState(''), [sort, setSort] = useState<{ k: string; d: 1 | -1 } | null>(null), [page, setPage] = useState(0)
  const cols = useMemo(() => s.cols.map(parseCol), [s])
  const filterField = s.filter ? fieldOf(s, s.filter) : undefined
  const size = cfg.pageSize ?? 20

  const shown = useMemo(() => {
    let r = rows
    if (flt) r = r.filter(x => String(x[s.filter!] ?? '') === flt)
    if (q.trim()) { const n = q.toLowerCase(); r = r.filter(x => Object.values(x).some(v => typeof v !== 'object' && String(v ?? '').toLowerCase().includes(n))) }
    if (sort) r = [...r].sort((a, b) => { const x = a[sort.k], y = b[sort.k]; return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true })) * sort.d })
    return r
  }, [rows, q, flt, sort, s])
  const pages = Math.max(1, Math.ceil(shown.length / size)), cur = Math.min(page, pages - 1)
  const slice = shown.slice(cur * size, cur * size + size)

  const header = <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
    <div><h1 className="text-xl font-semibold tracking-tight">{s.title}</h1>{s.description && <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>}</div>
    <div className="flex flex-wrap gap-2">{cfg.listActions}
      <Btn variant="outline" onClick={() => downloadCSV(s.collection, shown, [...cols.map(c => c.key)])} disabled={!shown.length}><Download size={14} />Export</Btn>
      {!cfg.noCreate && <LinkBtn href={`${ctx.base}/new`}><Plus size={14} />New {s.singular.toLowerCase()}</LinkBtn>}</div></div>

  if (error && !rows.length) return <div>{header}<Card className="p-6 text-sm text-destructive">{error}</Card></div>
  if (cfg.List) return <div>{header}{ready ? cfg.List({ rows, ctx, schema: s }) : <Empty>Loading…</Empty>}</div>

  return <div>{header}
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="relative min-w-52 flex-1 md:max-w-xs"><Search size={14} className="absolute left-3 top-3 text-muted-foreground" /><Input className="pl-8" placeholder={`Search ${s.title.toLowerCase()}…`} value={q} onChange={e => { setQ(e.target.value); setPage(0) }} />
          {q && <button className="absolute right-2 top-2.5 cursor-pointer text-muted-foreground" onClick={() => setQ('')} aria-label="Clear"><X size={14} /></button>}</div>
        {filterField?.options && <Select className="w-44" value={flt} onChange={e => { setFlt(e.target.value); setPage(0) }} options={['', ...filterField.options.filter(Boolean)]} aria-label={`Filter by ${filterField.label}`} />}
        <span className="ml-auto text-xs text-muted-foreground">{shown.length} of {rows.length}</span>
      </div>
      {!ready ? <Empty>Loading…</Empty> : !shown.length ? <Empty>{rows.length ? 'Nothing matches your search.' : <>No {s.title.toLowerCase()} yet. {!cfg.noCreate && <Link href={`${ctx.base}/new`} className="text-primary">Add the first one</Link>}</>}</Empty> :
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          {cols.map(c => <th key={c.key} className="whitespace-nowrap px-4 py-2.5 font-medium"><button className="inline-flex cursor-pointer items-center gap-1 hover:text-foreground" onClick={() => setSort(p => (p?.k === c.key ? (p.d === 1 ? { k: c.key, d: -1 } : null) : { k: c.key, d: 1 }))}>
            {fieldOf(s, c.key)?.label ?? prettify(c.key)}{sort?.k === c.key && (sort.d === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}</button></th>)}<th className="w-10" /></tr></thead>
          <tbody>{slice.map(r => <tr key={r.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-card-2" onClick={() => router.push(`${ctx.base}/${r.id}`)}>
            {cols.map(c => <td key={c.key} className="max-w-64 truncate px-4 py-2.5"><Cell v={r[c.key]} t={c.t} f={fieldOf(s, c.key)} /></td>)}
            <td className="px-2" onClick={e => e.stopPropagation()}><Menu items={rowItems(cfg, ctx, r)} /></td></tr>)}</tbody></table></div>}
      {shown.length > size && <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground"><span>Page {cur + 1} of {pages}</span>
        <div className="flex gap-1"><Btn size="sm" variant="outline" disabled={cur === 0} onClick={() => setPage(cur - 1)}><ChevronLeft size={13} /></Btn><Btn size="sm" variant="outline" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}><ChevronRight size={13} /></Btn></div></div>}
    </Card></div>
}

function rowItems(cfg: CrudConfig, ctx: Ctx, r: Row) {
  const go = (p: string) => () => ctx.go(p)
  return [
    { label: 'View', onClick: go(`${ctx.base}/${r.id}`) },
    ...(cfg.noEdit ? [] : [{ label: 'Edit', onClick: go(`${ctx.base}/${r.id}/edit`) }]),
    ...(cfg.actions?.(r, ctx) ?? []).map(a => ({ label: a.label, danger: a.danger, onClick: () => { if (a.href) ctx.go(a.href); else void a.onClick?.() } })),
    ...(cfg.noDelete ? [] : [{ label: 'Delete', danger: true, onClick: go(`${ctx.base}/${r.id}/delete`) }]),
  ]
}

/* ───────────────────────── detail ───────────────────────── */
function DetailScreen({ cfg, ctx, row }: { cfg: CrudConfig; ctx: Ctx; row: Row }) {
  const s = cfg.schema
  const [empty, setEmpty] = useState(false)
  const title = row[s.titleKey ?? 'name'] ?? s.singular, sub = s.subtitleKey ? row[s.subtitleKey] : ''
  const badge = s.filter ? row[s.filter] : ''
  const acts = cfg.actions?.(row, ctx) ?? []
  return <Screen back={ctx.base} backLabel={s.title} title={<span className="inline-flex flex-wrap items-center gap-2">{String(title)}{badge && <Badge>{String(badge)}</Badge>}</span>} subtitle={sub ? String(sub) : s.singular}
    actions={<>{acts.map(a => a.href ? <LinkBtn key={a.label} href={a.href} variant="outline">{a.label}</LinkBtn> : <Btn key={a.label} variant={a.danger ? 'danger' : 'outline'} onClick={() => a.onClick?.()}>{a.label}</Btn>)}
      {!cfg.noEdit && <LinkBtn href={`${ctx.base}/${row.id}/edit`}><Pencil size={14} />Edit</LinkBtn>}
      {!cfg.noDelete && <LinkBtn href={`${ctx.base}/${row.id}/delete`} variant="danger"><Trash2 size={14} />Delete</LinkBtn>}</>}>
    <div className="mb-3 flex justify-end"><label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"><Switch checked={empty} onChange={setEmpty} />Show empty fields</label></div>
    <div className="space-y-4">{s.sections.map(sec => {
      const fields = sec.fields.filter(f => empty || (row[f.key] !== undefined && row[f.key] !== '' && row[f.key] !== null))
      if (!fields.length) return null
      return <Card key={sec.title}><div className="border-b border-border px-4 py-3"><h3 className="text-sm font-semibold">{sec.title}</h3></div>
        <dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">{fields.map(f => <div key={f.key} className={cn('min-w-0', f.full && 'sm:col-span-2 lg:col-span-3')}>
          <dt className="text-xs text-muted-foreground">{f.label}</dt>
          <dd className="mt-0.5 break-words text-sm">{f.type === 'lines' ? <LinesView lines={row[f.key]} /> : f.type === 'textarea' ? <p className="whitespace-pre-wrap">{row[f.key] || '—'}</p> : <Cell v={row[f.key]} f={f} t={f.type === 'select' && /status|stage/i.test(f.key) ? '!' : ''} />}</dd></div>)}</dl></Card>
    })}
      {cfg.Detail?.({ row, ctx })}
      <p className="text-xs text-muted-foreground">Record ID {row.id}{row.createdAt ? ` · created ${fdt(row.createdAt)}` : ''}{row.updatedAt ? ` · updated ${fdt(row.updatedAt)}` : ''}</p></div>
  </Screen>
}

function LinesView({ lines }: { lines: any }) {
  const l: Line[] = Array.isArray(lines) ? lines : []
  if (!l.length) return <span className="text-muted-foreground">—</span>
  return <table className="mt-1 w-full text-xs"><thead><tr className="text-left text-muted-foreground"><th className="py-1">Description</th><th>HSN</th><th className="text-right">Qty</th><th className="text-right">Rate</th><th className="text-right">Tax</th><th className="text-right">Amount</th></tr></thead>
    <tbody>{l.map((x, i) => <tr key={i} className="border-t border-border"><td className="py-1.5">{x.desc}</td><td>{x.hsn}</td><td className="text-right">{x.qty}</td><td className="text-right">{inr(x.rate)}</td><td className="text-right">{x.tax}%</td><td className="text-right">{inr((x.qty || 0) * (x.rate || 0))}</td></tr>)}</tbody></table>
}

/* ───────────────────────── delete ───────────────────────── */
function DeleteScreen({ cfg, ctx, row }: { cfg: CrudConfig; ctx: Ctx; row: Row }) {
  const s = cfg.schema, [busy, setBusy] = useState(false)
  const name = String(row[s.titleKey ?? 'name'] ?? row.id)
  return <Screen narrow back={`${ctx.base}/${row.id}`} backLabel="Cancel" title={`Delete ${s.singular.toLowerCase()}?`} subtitle="This cannot be undone.">
    <Card className="p-5"><p className="text-sm">You are about to permanently delete <b>{name}</b>{s.subtitleKey && row[s.subtitleKey] ? <> ({String(row[s.subtitleKey])})</> : null}. Anything linked to it will keep working but will no longer be able to open this record.</p>
      <div className="mt-5 flex gap-2"><Btn variant="danger" disabled={busy} onClick={async () => { setBusy(true); if (await run(db.remove(s.collection, row.id), `${s.singular} deleted`)) ctx.go(ctx.base); else setBusy(false) }}><Trash2 size={14} />{busy ? 'Deleting…' : 'Yes, delete'}</Btn><LinkBtn href={`${ctx.base}/${row.id}`} variant="outline">Keep it</LinkBtn></div></Card>
  </Screen>
}

/* ───────────────────────── form ───────────────────────── */
export function FieldInput({ f, v, onChange }: { f: Field; v: any; onChange: (v: any) => void }) {
  const ph = f.placeholder
  switch (f.type) {
    case 'textarea': return <Textarea rows={4} value={v ?? ''} onChange={e => onChange(e.target.value)} placeholder={ph} />
    case 'select': return <Select value={v ?? ''} onChange={e => onChange(e.target.value)} options={f.options && f.options.includes(String(v ?? '')) || !v ? f.options ?? [] : [String(v), ...(f.options ?? [])]} />
    case 'switch': return <div className="flex h-9 items-center"><Switch checked={!!v} onChange={onChange} /></div>
    case 'password': return <SecretInput value={v ?? ''} onChange={onChange} placeholder={ph} />
    case 'number': return <Input type="number" step="any" value={v ?? ''} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} placeholder={ph} />
    case 'date': return <Input type="date" value={String(v ?? '').slice(0, 10)} onChange={e => onChange(e.target.value)} />
    case 'datetime-local': return <Input type="datetime-local" value={toLocalInput(v)} onChange={e => onChange(e.target.value)} />
    case 'color': return <div className="flex gap-2"><input type="color" className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background p-1" value={/^#[0-9a-f]{6}$/i.test(v ?? '') ? v : '#7c3aed'} onChange={e => onChange(e.target.value)} /><Input value={v ?? ''} onChange={e => onChange(e.target.value)} placeholder="#7c3aed" /></div>
    case 'lines': return null
    default: return <Input type={f.type ?? 'text'} value={Array.isArray(v) ? v.join(', ') : v ?? ''} onChange={e => onChange(e.target.value)} placeholder={ph} />
  }
}

export function LineItems({ v, set }: { v: Row; set: (p: Partial<Row>) => void }) {
  const lines: Line[] = Array.isArray(v.lineItems) ? v.lineItems : []
  const upd = (i: number, p: Partial<Line>) => set({ lineItems: lines.map((l, j) => (j === i ? { ...l, ...p } : l)) })
  const t = computeTotals(v)
  return <div className="space-y-3">
    <div className="hidden grid-cols-[1fr_90px_70px_100px_70px_32px] gap-2 text-xs text-muted-foreground md:grid"><span>Description</span><span>HSN / SAC</span><span>Qty</span><span>Rate (₹)</span><span>Tax %</span><span /></div>
    {lines.map((l, i) => <div key={i} className="grid grid-cols-2 items-center gap-2 md:grid-cols-[1fr_90px_70px_100px_70px_32px]">
      <Input className="col-span-2 md:col-span-1" placeholder="Item or service" value={l.desc ?? ''} onChange={e => upd(i, { desc: e.target.value })} />
      <Input placeholder="HSN" value={l.hsn ?? ''} onChange={e => upd(i, { hsn: e.target.value })} />
      <Input type="number" min={0} value={l.qty ?? ''} onChange={e => upd(i, { qty: Number(e.target.value) })} />
      <Input type="number" min={0} value={l.rate ?? ''} onChange={e => upd(i, { rate: Number(e.target.value) })} />
      <Input type="number" min={0} value={l.tax ?? ''} onChange={e => upd(i, { tax: Number(e.target.value) })} />
      <button type="button" className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => set({ lineItems: lines.filter((_, j) => j !== i) })} aria-label="Remove line"><X size={16} /></button></div>)}
    <Btn variant="outline" size="sm" onClick={() => set({ lineItems: [...lines, { desc: '', qty: 1, rate: 0, tax: 18 }] })}><Plus size={13} />Add line</Btn>
    <div className="ml-auto max-w-xs space-y-1 border-t border-border pt-3 text-sm">
      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{inr(t.amount)}</span></div>
      {t.discountTotal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>− {inr(t.discountTotal)}</span></div>}
      <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{inr(t.taxAmount)}</span></div>
      <div className="flex justify-between border-t border-border pt-1 font-semibold"><span>Total</span><span>{inr(t.total)}</span></div></div>
  </div>
}

/** Sectioned form with a sticky section index — handles 60+ fields without a wall of inputs. */
export function SectionedForm({ s, v, set, errors }: { s: Schema; v: Row; set: (p: Partial<Row>) => void; errors: Set<string> }) {
  const id = (t: string) => 'sec-' + t.toLowerCase().replace(/\W+/g, '-')
  return <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
    <nav className="sticky top-20 hidden h-fit space-y-0.5 lg:block">{s.sections.map(x => <a key={x.title} href={`#${id(x.title)}`} className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-card-2 hover:text-foreground">{x.title}<span className="ml-1 text-[10px]">{x.fields.length}</span></a>)}</nav>
    <div className="space-y-5">{s.sections.map(sec => <Card key={sec.title} className="scroll-mt-20"><div id={id(sec.title)} className="scroll-mt-24 border-b border-border px-4 py-3"><h3 className="text-sm font-semibold">{sec.title}</h3>{sec.description && <p className="text-xs text-muted-foreground">{sec.description}</p>}</div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">{sec.fields.map(f => f.type === 'lines'
        ? <div key={f.key} className="sm:col-span-2"><Label>{f.label}</Label><LineItems v={v} set={set} /></div>
        : <div key={f.key} className={cn(f.full && 'sm:col-span-2')}><Label>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label><FieldInput f={f} v={v[f.key]} onChange={x => set({ [f.key]: x })} />
          {errors.has(f.key) && <p className="mt-1 text-xs text-destructive">{f.label} is required</p>}</div>)}</div></Card>)}</div>
  </div>
}

const HAS_LINES = (s: Schema) => s.sections.some(x => x.fields.some(f => f.type === 'lines'))
function FormScreen({ cfg, ctx, row }: { cfg: CrudConfig; ctx: Ctx; row?: Row }) {
  const s = cfg.schema, edit = !!row
  const [v, setV] = useState<Row>(() => ({ ...(s.defaults ?? {}), ...(cfg.defaults ?? {}), ...(row ?? {}), id: row?.id ?? '' }))
  const [errors, setErrors] = useState<Set<string>>(new Set()), [busy, setBusy] = useState(false)
  const lines = HAS_LINES(s)
  const set = (p: Partial<Row>) => setV(prev => { const n = { ...prev, ...p }; return lines ? { ...n, ...computeTotals(n) } : n })

  async function save() {
    const missing = new Set(s.sections.flatMap(x => x.fields).filter(f => f.required && (v[f.key] === undefined || v[f.key] === null || String(v[f.key]).trim() === '')).map(f => f.key))
    if (!edit && (s.collection === 'users' || s.collection === 'team') && String(v.password ?? '').length < 8) missing.add('password')
    setErrors(missing)
    if (missing.size) { document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' }); return void run(Promise.reject(new Error(`Please fill the required fields: ${[...missing].map(k => fieldOf(s, k)?.label ?? k).join(', ')}`))) }
    let data: Record<string, any> = { ...v }; delete data.id
    // On edit, send only what changed so concurrent updates (e.g. new chat messages) are never overwritten.
    if (edit) data = Object.fromEntries(Object.entries(data).filter(([k, x]) => JSON.stringify(x) !== JSON.stringify(row![k])))
    if (edit && !String(data.password ?? '')) delete data.password
    setBusy(true)
    let saved: Row | undefined
    const ok = await run(async () => { saved = edit ? await db.update(s.collection, row!.id, data) : await db.create(s.collection, data) }, `${s.singular} ${edit ? 'updated' : 'created'}`)
    if (ok) ctx.go(edit ? `${ctx.base}/${row!.id}` : saved ? `${ctx.base}/${saved.id}` : ctx.base); else setBusy(false)
  }
  return <Screen back={edit ? `${ctx.base}/${row!.id}` : ctx.base} backLabel={edit ? 'Cancel' : s.title} title={edit ? `Edit ${s.singular.toLowerCase()}` : `New ${s.singular.toLowerCase()}`} subtitle={edit ? String(row![s.titleKey ?? 'name'] ?? '') : s.description}>
    <div id="form-top" />
    <SectionedForm s={s} v={v} set={set} errors={errors} />
    <ActionBar><LinkBtn href={edit ? `${ctx.base}/${row!.id}` : ctx.base} variant="outline">Cancel</LinkBtn><Btn onClick={save} disabled={busy}>{busy ? 'Saving…' : edit ? 'Save changes' : `Create ${s.singular.toLowerCase()}`}</Btn></ActionBar>
  </Screen>
}

/* ───────────────────────── single-document settings (settings, waapi, aiconfig, siteTheme) ───────────────────────── */
export function DocForm({ collection, title, description, header, footer }: { collection: string; title?: string; description?: string; header?: ReactNode; footer?: (doc: Row) => ReactNode }) {
  const s = DOCS[collection] ?? SCHEMAS[collection]
  const { doc, ready, save } = useDoc(collection)
  const [draft, setDraft] = useState<Row | null>(null), [busy, setBusy] = useState(false)
  const v = draft ?? doc
  if (!ready) return <Empty>Loading…</Empty>
  return <div className="mx-auto w-full max-w-5xl">
    <div className="mb-5"><h1 className="text-xl font-semibold tracking-tight">{title ?? s.title}</h1>{(description ?? s.description) && <p className="mt-0.5 text-sm text-muted-foreground">{description ?? s.description}</p>}</div>
    {header}
    <SectionedForm s={s} v={v} set={p => setDraft({ ...v, ...p })} errors={new Set()} />
    {footer?.(doc)}
    <ActionBar>{draft && <Btn variant="outline" onClick={() => setDraft(null)}>Discard changes</Btn>}<Btn disabled={busy || !draft} onClick={async () => { setBusy(true); const { id, ...d } = v; if (await run(save(d), 'Saved')) setDraft(null); setBusy(false) }}>{busy ? 'Saving…' : 'Save'}</Btn></ActionBar>
  </div>
}
