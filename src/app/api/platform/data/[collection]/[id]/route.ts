import { dataOp, isErr, needSession, err } from '@/lib/server/data'

type Ctx = { params: Promise<{ collection: string; id: string }> }
export async function PATCH(req: Request, { params }: Ctx) {
  const s = await needSession(); if (isErr(s)) return s
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return err('Invalid JSON')
  const { collection, id } = await params
  return dataOp('update', collection, s, id, body)
}
export async function DELETE(_: Request, { params }: Ctx) {
  const s = await needSession(); if (isErr(s)) return s
  const { collection, id } = await params
  return dataOp('remove', collection, s, id)
}
