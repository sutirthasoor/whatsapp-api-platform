'use client'
import { usePathname } from 'next/navigation'
import { ADMIN_PAGES, PANEL_PAGES } from './apps'
import { RouteCtx } from './route'

/** Resolves page component + sub-route (new / <id> / <id>/edit / <id>/delete) from the URL. */
export function PageHost({ slug }: { slug: string[] }) {
  const admin = usePathname().startsWith('/admin')
  const pages = admin ? ADMIN_PAGES : PANEL_PAGES
  const root = admin ? '/admin' : '/panel'
  const parts = slug.length ? slug : ['dashboard']
  for (let i = parts.length; i >= 1; i--) {
    const C = pages[parts.slice(0, i).join('/')]
    if (C) return <RouteCtx.Provider value={{ base: `${root}/${parts.slice(0, i).join('/')}`, sub: parts.slice(i) }}><C /></RouteCtx.Provider>
  }
  return <p className="p-10 text-center text-muted-foreground">Page not found.</p>
}
