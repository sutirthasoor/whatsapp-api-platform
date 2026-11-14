import { promises as fs } from 'node:fs'
import path from 'node:path'
import { err, isErr, json, needSession } from '@/lib/server/data'
import { DATA_DIR, rows, nowIso, randomTokenSafe } from '@/lib/server/store'

const MAX = 16 * 1024 * 1024
const dir = (org: string) => path.join(DATA_DIR, 'uploads', org.replace(/[^\w-]/g, ''))
const kind = (t: string) => (t.startsWith('image') ? 'image' : t.startsWith('video') ? 'video' : t.startsWith('audio') ? 'audio' : 'document')

export async function POST(req: Request) {
  const s = await needSession('customer'); if (isErr(s)) return s
  if (s.teamRole === 'Viewer') return err('Your role is read-only', 403)
  const form = await req.formData().catch(() => null); const file = form?.get('file')
  if (!(file instanceof File)) return err('No file uploaded')
  if (file.size > MAX) return err('File is larger than 16 MB')
  const fid = randomTokenSafe(8), ext = path.extname(file.name).slice(0, 10).replace(/[^\w.]/g, '')
  await fs.mkdir(dir(s.orgId), { recursive: true })
  await fs.writeFile(path.join(dir(s.orgId), fid + ext), Buffer.from(await file.arrayBuffer()))
  const row = await rows.create(`org:${s.orgId}`, 'media', { name: file.name, type: kind(file.type), mime: file.type, sizeBytes: file.size, size: `${(file.size / 1048576).toFixed(2)} MB`, fileId: fid + ext, folder: String(form?.get('folder') ?? ''), caption: String(form?.get('caption') ?? ''), altText: '', tags: '', usedIn: '', status: 'Active', uploadedBy: s.name, createdAt: nowIso() })
  return json({ row }, 201)
}
export async function GET(req: Request) {
  const s = await needSession('customer'); if (isErr(s)) return s
  const id = new URL(req.url).searchParams.get('id')
  const m = (await rows.list(`org:${s.orgId}`, 'media')).find(x => x.id === id); if (!m) return err('Not found', 404)
  const buf = await fs.readFile(path.join(dir(s.orgId), m.fileId)).catch(() => null); if (!buf) return err('File missing', 404)
  return new Response(new Uint8Array(buf), { headers: { 'Content-Type': m.mime || 'application/octet-stream', 'Content-Disposition': `inline; filename="${encodeURIComponent(m.name)}"`, 'Cache-Control': 'private, max-age=3600' } })
}
