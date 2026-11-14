import { err, isErr, json, needSession } from '@/lib/server/data'
import { createIntent, publicOptions, verifyPayment } from '@/lib/server/pay'

export async function POST(req: Request) {
  const s = await needSession('customer'); if (isErr(s)) return s
  const b = await req.json().catch(() => ({}))
  try {
    if (b.op === 'options') return json({ gateways: await publicOptions() })
    if (s.teamRole && !['Owner', 'Admin'].includes(s.teamRole)) return err('Only owners and admins can manage billing', 403)
    if (b.op === 'create') return json(await createIntent(s.orgId, b.planId, b.cycle === 'Yearly' ? 'Yearly' : 'Monthly', b.gatewayId, new URL(req.url).origin))
    if (b.op === 'verify') return json({ ok: true, intent: await verifyPayment(s.orgId, b) })
  } catch (e: any) { return err(e?.message ?? 'Payment error', 400) }
  return err('Unknown action')
}
