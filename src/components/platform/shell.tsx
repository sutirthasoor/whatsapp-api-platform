'use client'
import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, LogOut, Menu as MenuI, Undo2, X } from 'lucide-react'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { cn } from '@/lib/utils'
import { ADMIN_NAV, PANEL_NAV, type NavItem } from './nav'
import { api } from '@/lib/platform/client-store'
import { run } from './ui'

interface User { name: string; email: string; teamRole?: string; company?: string }

function Group({ item, path, onNav }: { item: NavItem; path: string; onNav: () => void }) {
  const active = item.children?.some(c => path === c.href || path.startsWith(c.href + '/'))
  const [open, setOpen] = useState(!!active)
  useEffect(() => { if (active) setOpen(true) }, [active])
  const Icon = item.icon
  const base = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition'
  if (!item.children) {
    const on = path === item.href || path.startsWith(item.href + '/')
    return <Link href={item.href!} onClick={onNav} className={cn(base, on ? 'bg-primary-soft font-medium text-primary' : 'text-muted-foreground hover:bg-card-2 hover:text-foreground')}>{Icon && <Icon size={16} />}{item.label}</Link>
  }
  return <div>
    <button type="button" onClick={() => setOpen(!open)} className={cn(base, 'cursor-pointer', active ? 'font-medium text-foreground' : 'text-muted-foreground hover:bg-card-2 hover:text-foreground')}>
      {Icon && <Icon size={16} />}<span className="flex-1 text-left">{item.label}</span><ChevronDown size={14} className={cn('transition', open && 'rotate-180')} /></button>
    {open && <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">{item.children.map(c => {
      const on = path === c.href || path.startsWith(c.href + '/')
      return <Link key={c.href} href={c.href} onClick={onNav} className={cn('block rounded-md px-3 py-1.5 text-[13px]', on ? 'bg-primary-soft font-medium text-primary' : 'text-muted-foreground hover:bg-card-2 hover:text-foreground')}>{c.label}</Link>
    })}</div>}
  </div>
}

export function Shell({ area, user, impersonating, children }: { area: 'admin' | 'panel'; user: User; impersonating?: boolean; children: ReactNode }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const nav = area === 'admin' ? ADMIN_NAV : PANEL_NAV
  useEffect(() => setOpen(false), [path])

  const logout = () => run(async () => { await api('auth/logout', {}); window.location.href = '/' })
  const back = () => run(async () => { const j = await api<{ redirect: string }>('auth/impersonate', undefined, 'DELETE'); window.location.href = j.redirect })

  return <div className="flex min-h-screen bg-background text-foreground">
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">W</span>
          <div className="leading-tight"><p className="text-sm font-semibold">WhatsCRM</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{area === 'admin' ? 'Admin panel' : user.company || 'Workspace'}</p></div></div>
        <button className="cursor-pointer text-muted-foreground lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">{nav.map(i => <Group key={i.label} item={i} path={path} onNav={() => setOpen(false)} />)}</nav>
      <div className="border-t border-border p-3">
        <div className="mb-2 px-1"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-xs text-muted-foreground">{user.email}{user.teamRole ? ` · ${user.teamRole}` : ''}</p></div>
        <button onClick={logout} className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-card-2 hover:text-foreground"><LogOut size={15} />Sign out</button>
      </div>
    </aside>
    {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
    <div className="flex min-w-0 flex-1 flex-col">
      {impersonating && <div className="flex items-center justify-between gap-3 bg-amber-500/15 px-4 py-2 text-sm text-amber-600"><span>You are viewing this workspace as <b>{user.name}</b>.</span>
        <button onClick={back} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-amber-500/20 px-3 py-1 text-xs font-medium hover:bg-amber-500/30"><Undo2 size={13} />Back to admin</button></div>}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
        <button className="cursor-pointer text-muted-foreground lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><MenuI size={20} /></button>
        <span className="hidden text-sm text-muted-foreground lg:block">{area === 'admin' ? 'Platform administration' : 'Customer workspace'}</span>
        <div className="flex items-center gap-1"><ModeToggle /></div>
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  </div>
}
