import { redirect } from 'next/navigation'
import { getSession, homeFor } from '@/lib/server/session'
import { Shell } from '@/components/platform/shell'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin · WhatsCRM' }

export default async function Layout({ children }: { children: React.ReactNode }) {
  const s = await getSession()
  if (!s) redirect('/login')
  if (s.role !== 'admin') redirect(homeFor(s.role))
  return <Shell area="admin" user={{ name: s.name, email: s.email }}>{children}</Shell>
}
