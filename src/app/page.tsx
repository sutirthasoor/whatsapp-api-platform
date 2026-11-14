import { redirect } from 'next/navigation'
import { getSession, homeFor } from '@/lib/server/session'
import { AuthForm } from '@/components/platform/auth-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sign in · WhatsCRM' }

/** The app opens on the login screen. A signed-in visitor is sent straight to their own area (admin or customer). */
export default async function RootPage() {
  const s = await getSession()
  if (s) redirect(homeFor(s.role))
  return <AuthForm mode="login" />
}
