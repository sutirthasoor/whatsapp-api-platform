import { dataOp, isErr, needSession, err } from '@/lib/server/data'

type Ctx = { params: Promise<{ collection: string }> }
export async function GET(_: Request, { params }: Ctx) {
  const s = await needSession(); if (isErr(s)) return s
  return dataOp('list', (await params).collection, s)
}
export async function POST(req: Request, { params }: Ctx) {
  const s = await needSession(); if (isErr(s)) return s
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return err('Invalid JSON')
  return dataOp('create', (await params).collection, s, undefined, body)
}
