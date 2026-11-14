import { PublicLeadForm } from '@/components/platform/public-forms'
export const metadata = { title: 'Get in touch' }
export default async function Page({ params }: { params: Promise<{ org: string; slug: string }> }) {
  const { org, slug } = await params
  return <PublicLeadForm org={org} slug={slug} />
}
