'use client'
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)
export const fdate = (v: any) => { if (!v) return '—'; const d = new Date(v); return isNaN(+d) ? String(v) : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
export const fdt = (v: any) => { if (!v) return '—'; const d = new Date(v); return isNaN(+d) ? String(v) : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }
export const copy = (t: string, msg = 'Copied to clipboard') => { navigator.clipboard?.writeText(t); toast.success(msg) }
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))
/** Run an async action and toast success / failure. Returns true on success. */
export async function run(p: Promise<any> | (() => Promise<any>), ok?: string): Promise<boolean> {
  try { await (typeof p === 'function' ? p() : p); if (ok) toast.success(ok); return true } catch (e) { toast.error(errMsg(e)); return false }
}
export function downloadCSV(name: string, rows: Record<string, any>[], keys: string[]) {
  const esc = (v: any) => `"${String(typeof v === 'object' && v ? JSON.stringify(v) : v ?? '').replace(/"/g, '""')}"`
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `${name}.csv`; a.click()
  toast.success(`Exported ${rows.length} rows`)
}

export function Btn({ variant = 'primary', size = 'md', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'danger'; size?: 'sm' | 'md' }) {
  return <button type="button" {...p} className={cn('inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
    size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
    variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary-hover',
    variant === 'outline' && 'border border-border bg-card hover:bg-card-2',
    variant === 'ghost' && 'hover:bg-card-2',
    variant === 'danger' && 'bg-destructive/15 text-destructive hover:bg-destructive/25', className)} />
}
/** A link that looks like a button. */
export function LinkBtn({ href, variant = 'primary', size = 'md', className, children }: { href: string; variant?: 'primary' | 'outline' | 'ghost' | 'danger'; size?: 'sm' | 'md'; className?: string; children: ReactNode }) {
  return <Link href={href} className={cn('inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition', size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
    variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary-hover', variant === 'outline' && 'border border-border bg-card hover:bg-card-2', variant === 'ghost' && 'hover:bg-card-2', variant === 'danger' && 'bg-destructive/15 text-destructive hover:bg-destructive/25', className)}>{children}</Link>
}
export const inputCls = 'h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40 disabled:opacity-60'
export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(inputCls, p.className)} />
export const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={cn(inputCls, 'h-auto py-2', p.className)} />
export const Select = ({ options, className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) => (
  <select {...p} className={cn(inputCls, 'cursor-pointer', className)}>{options.map(o => <option key={o} value={o}>{o === '' ? '—' : o}</option>)}</select>)
export const Label = ({ children }: { children: ReactNode }) => <label className="mb-1 block text-xs font-medium text-muted-foreground">{children}</label>
export function SecretInput({ value, onChange, ...p }: { value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  const [s, setS] = useState(false)
  return <div className="flex gap-2"><Input {...p} type={s ? 'text' : 'password'} autoComplete="off" value={value ?? ''} onChange={e => onChange(e.target.value)} /><Btn variant="outline" onClick={() => setS(!s)} aria-label="Show / hide">{s ? <EyeOff size={14} /> : <Eye size={14} />}</Btn></div>
}
export function Secret({ v }: { v: string }) { const [s, setS] = useState(false); return <span className="inline-flex items-center gap-2"><code className="text-xs">{s ? v : '••••••••••••'}</code><button type="button" className="cursor-pointer text-muted-foreground" onClick={() => setS(!s)}>{s ? <EyeOff size={13} /> : <Eye size={13} />}</button></span> }

export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={cn('relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition', checked ? 'bg-primary' : 'bg-muted')}>
    <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', checked ? 'left-[18px]' : 'left-0.5')} /></button>
}

const GOOD = ['Active', 'Paid', 'Completed', 'Won', 'Approved', 'Published', 'Resolved', 'Accepted', 'Sent', 'Done', 'Live', 'Connected', 'Qualified', 'Green', 'Customer', 'Production', 'Inbound', 'Verified', 'Success', 'Owner', 'Admin', 'VIP', 'Hot', 'Normal']
const WARN = ['Pending', 'Draft', 'Trial', 'Trialing', 'Scheduled', 'Open', 'Proposal', 'In progress', 'Partial', 'Test', 'Running', 'New', 'Contacted', 'Medium', 'Invited', 'Staging', 'Negotiation', 'Unpaid', 'Low', 'Yellow', 'Waiting on customer', 'Agent', 'Reseller', 'Rescheduled']
const BAD = ['Failed', 'Overdue', 'Rejected', 'Lost', 'Missed', 'Suspended', 'Cancelled', 'Past due', 'Inactive', 'Refunded', 'Closed', 'High', 'Urgent', 'Red', 'Expired', 'Revoked', 'Churned', 'Spam', 'No-show', 'Retired', 'Hidden']
export function Badge({ children, tone }: { children: ReactNode; tone?: 'good' | 'warn' | 'bad' | 'info' }) {
  const s = String(children)
  const t = tone ?? (GOOD.includes(s) ? 'good' : WARN.includes(s) ? 'warn' : BAD.includes(s) ? 'bad' : 'info')
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium',
    t === 'good' && 'bg-emerald-500/15 text-emerald-500', t === 'warn' && 'bg-amber-500/15 text-amber-500', t === 'bad' && 'bg-red-500/15 text-red-500', t === 'info' && 'bg-primary-soft text-primary')}>{children}</span>
}

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn('rounded-xl border border-border bg-card', className)}>{children}</div>
export const CardHead = ({ title, action, description }: { title: string; action?: ReactNode; description?: string }) => (
  <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><div><h3 className="text-sm font-semibold">{title}</h3>{description && <p className="text-xs text-muted-foreground">{description}</p>}</div>{action}</div>)

export function Stat({ label, value, hint, icon: Icon }: { label: string; value: ReactNode; hint?: string; icon?: React.ElementType }) {
  return <Card className="p-4"><div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>
    {Icon && <span className="rounded-lg bg-primary-soft p-2 text-primary"><Icon size={18} /></span>}</div></Card>
}
export const Stats = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>

export function PageHead({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-xl font-semibold tracking-tight">{title}</h1>
    {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}</div><div className="flex flex-wrap gap-2">{actions}</div></div>
}
/** Full-page screen with a back link — used wherever a pop-up dialog would have been. */
export function Screen({ title, subtitle, back, backLabel = 'Back', actions, children, narrow }: { title: ReactNode; subtitle?: ReactNode; back?: string; backLabel?: string; actions?: ReactNode; children: ReactNode; narrow?: boolean }) {
  return <div className={cn('mx-auto w-full', narrow ? 'max-w-3xl' : 'max-w-5xl')}>
    {back && <Link href={back} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} />{backLabel}</Link>}
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>{subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}</div><div className="flex flex-wrap gap-2">{actions}</div></div>
    {children}</div>
}
/** Sticky bar holding a screen's primary actions. */
export const ActionBar = ({ children }: { children: ReactNode }) => <div className="sticky bottom-0 z-10 -mx-4 mt-5 flex items-center justify-end gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">{children}</div>

export function Tabs({ tabs }: { tabs: { id: string; label: string; node: ReactNode }[] }) {
  const [t, setT] = useState(tabs[0].id)
  return <div><div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">{tabs.map(x => (
    <button key={x.id} onClick={() => setT(x.id)} className={cn('-mb-px cursor-pointer whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium', t === x.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>{x.label}</button>))}</div>
    {tabs.find(x => x.id === t)?.node}</div>
}

export function Menu({ items }: { items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [o, setO] = useState(false); const r = useRef<HTMLDivElement>(null)
  useEffect(() => { const h = (e: MouseEvent) => { if (!r.current?.contains(e.target as Node)) setO(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
  return <div ref={r} className="relative"><button onClick={() => setO(!o)} className="cursor-pointer rounded-md px-2 py-1 text-muted-foreground hover:bg-card-2" aria-label="More">⋯</button>
    {o && <div className="absolute right-0 z-30 mt-1 min-w-44 rounded-lg border border-border bg-popover p-1 shadow-xl">{items.map(i => (
      <button key={i.label} onClick={() => { setO(false); i.onClick() }} className={cn('block w-full cursor-pointer rounded-md px-3 py-1.5 text-left text-xs hover:bg-card-2', i.danger && 'text-destructive')}>{i.label}</button>))}</div>}</div>
}

export function Progress({ value, max }: { value: number; max: number }) {
  const p = Math.min(100, Math.round((value / (max || 1)) * 100))
  return <div className="min-w-24"><div className="h-1.5 rounded-full bg-muted"><div className={cn('h-full rounded-full', p > 85 ? 'bg-red-500' : p > 65 ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${p}%` }} /></div>
    <p className="mt-0.5 text-[10px] text-muted-foreground">{value.toLocaleString('en-IN')} / {max.toLocaleString('en-IN')}</p></div>
}
export const Empty = ({ children }: { children: ReactNode }) => <p className="p-10 text-center text-sm text-muted-foreground">{children}</p>
