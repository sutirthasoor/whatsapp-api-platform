import { NextResponse } from 'next/server'
import { rows, nowIso } from '@/lib/server/store'
import { rateLimit } from '@/lib/server/ratelimit'

const bad = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s })

/** GET ?org=&slug= → public lead-form definition. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  const f = (await rows.list(`org:${q.get('org')}`, 'leadforms')).find(x => x.slug === q.get('slug') && x.status === 'Active')
  if (!f) return bad('Form not found', 404)
  const { id, name, title, description, collect, submitLabel, successMessage, brandColor, requiredFields, redirectUrl } = f
  return NextResponse.json({ form: { id, name, title, description, collect, submitLabel, successMessage, brandColor, requiredFields, redirectUrl } })
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}))
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'
  if (!rateLimit(`pub:${ip}`, 10, 60_000)) return bad('Too many submissions', 429)
  if (b.op === 'enquiry') {                                 // public "contact sales" form → admin Enquiries
    if (!String(b.name ?? '').trim() || !(b.email || b.phone)) return bad('Name and an email or phone are required')
    await rows.create('global', 'enquiries', { name: b.name, email: b.email ?? '', phone: b.phone ?? '', company: b.company ?? '', interest: b.interest ?? '', message: b.message ?? '', source: 'Website', status: 'New', priority: 'Normal', created: nowIso() })
    return NextResponse.json({ ok: true })
  }
  if (b.op === 'form') {
    const sc = `org:${b.org}`
    const f = (await rows.list(sc, 'leadforms')).find(x => x.slug === b.slug && x.status === 'Active'); if (!f) return bad('Form not found', 404)
    const d = b.data ?? {}
    const need = String(f.requiredFields ?? 'name,phone').split(',').map((x: string) => x.trim()).filter(Boolean)
    for (const k of need) if (!String(d[k] ?? '').trim()) return bad(`${k} is required`)
    await rows.create(sc, 'leads', { name: d.name ?? '', phone: d.phone ?? '', email: d.email ?? '', company: d.company ?? '', city: d.city ?? '', requirement: d.message ?? '', source: f.source || 'Lead form', sourceDetail: f.name, status: 'New', owner: f.assignTo ?? '', createdAt: nowIso(), whatsappOptIn: true })
    await rows.update(sc, 'leadforms', f.id, { submissions: (f.submissions ?? 0) + 1, lastSubmissionAt: nowIso() })
    return NextResponse.json({ ok: true, message: f.successMessage || 'Thank you! We will contact you shortly.', redirect: f.redirectUrl || '' })
  }
  return bad('Unknown action')
}
