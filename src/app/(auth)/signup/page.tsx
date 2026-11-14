import { redirect } from 'next/navigation'
import { getSession, homeFor } from '@/lib/server/session'
import { AuthForm } from '@/components/platform/auth-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Create account · WhatsCRM' }

export default async function SignupPage() {
  const s = await getSession()
  if (s) redirect(homeFor(s.role))
  return <AuthForm mode="signup" />
}
