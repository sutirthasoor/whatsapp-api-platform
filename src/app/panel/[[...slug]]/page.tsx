import { PageHost } from '@/components/platform/page-host'

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  return <PageHost slug={(await params).slug ?? []} />
}
