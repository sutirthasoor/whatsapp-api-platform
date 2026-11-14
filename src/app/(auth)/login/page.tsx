import { redirect } from 'next/navigation'
import { getSession, homeFor } from '@/lib/server/session'
import { AuthForm } from '@/components/platform/auth-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sign in · WhatsCRM' }

export default async function LoginPage() {
  const s = await getSession()
  if (s) redirect(homeFor(s.role))
  return <AuthForm mode="login" />
}
