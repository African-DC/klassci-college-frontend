import { TenantDetail } from "@/components/super-admin/tenants/TenantDetail"

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <TenantDetail slug={slug} />
}
