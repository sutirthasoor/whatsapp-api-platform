'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, MessageCircle, ShieldCheck, Workflow, Zap } from 'lucide-react'

const input = 'h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40'

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter()
  const [v, setV] = useState({ name: '', company: '', phone: '', email: '', password: '' })
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV(p => ({ ...p, [k]: e.target.value }))
  const login = mode === 'login'

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const r = await fetch(`/api/platform/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error ?? 'Something went wrong')
      router.replace(j.redirect)          // admin → /admin/dashboard, customer → /panel/dashboard
      router.refresh()
    } catch (err: any) { setError(err.message); setBusy(false) }
  }

  return <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
    <section className="relative hidden flex-col justify-between overflow-hidden bg-card-2 p-12 lg:flex">
      <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-base font-bold text-primary-foreground">W</span><span className="text-lg font-semibold">WhatsCRM</span></div>
      <div>
        <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">Run your whole customer conversation on WhatsApp.</h1>
        <p className="mt-4 max-w-md text-muted-foreground">Shared inbox, broadcasts, pipelines, quotations, invoices and AI replies — one workspace for your team.</p>
        <ul className="mt-8 space-y-3 text-sm">{[[MessageCircle, 'Shared team inbox on the official WhatsApp Cloud API'], [Workflow, 'Chatbot, FAQ bot and AI assistant that answer for you'], [Zap, 'Broadcasts, follow-ups and payment reminders'], [ShieldCheck, 'Role-based access for admins, owners and agents']].map(([I, t], i) => { const Icon = I as React.ElementType; return <li key={i} className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary"><Icon size={16} /></span>{t as string}</li> })}</ul>
      </div>
      <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} WhatsCRM</p>
    </section>
    <section className="flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div className="mb-2 flex items-center gap-2.5 lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">W</span><span className="text-lg font-semibold">WhatsCRM</span></div>
        <div><h2 className="text-2xl font-semibold tracking-tight">{login ? 'Welcome back' : 'Create your workspace'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{login ? 'Sign in with your email and password. Admins and customers use the same screen.' : 'Start a free trial. No card required.'}</p></div>
        {!login && <>
          <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Your name *</label><input className={input} value={v.name} onChange={set('name')} autoComplete="name" required /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-xs font-medium text-muted-foreground">Business</label><input className={input} value={v.company} onChange={set('company')} autoComplete="organization" /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Phone</label><input className={input} value={v.phone} onChange={set('phone')} type="tel" autoComplete="tel" /></div></div></>}
        <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Email *</label><input className={input} type="email" value={v.email} onChange={set('email')} autoComplete="email" required autoFocus={login} /></div>
        <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Password *</label>
          <div className="relative"><input className={input + ' pr-10'} type={show ? 'text' : 'password'} value={v.password} onChange={set('password')} autoComplete={login ? 'current-password' : 'new-password'} minLength={login ? undefined : 8} required />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 cursor-pointer text-muted-foreground" aria-label="Toggle password">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
          {!login && <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>}</div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="h-11 w-full cursor-pointer rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{busy ? 'Please wait…' : login ? 'Sign in' : 'Create account'}</button>
        <p className="text-center text-sm text-muted-foreground">{login ? <>New here? <Link href="/signup" className="font-medium text-primary">Create an account</Link></> : <>Already have an account? <Link href="/login" className="font-medium text-primary">Sign in</Link></>}</p>
        {login && <p className="text-center text-xs text-muted-foreground">Forgot your password? Ask your workspace owner to reset it, or <Link href="/enquiry" className="text-primary">contact us</Link>.</p>}
      </form>
    </section>
  </main>
}
