import { ManualVerifier } from "./_components/manual-verifier"
import { resolveTenantSlug } from "@/lib/utils/tenant-slug"

export default async function VerifierByCodePage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string | string[] }>
}) {
  const { tenant } = await searchParams

  return <ManualVerifier tenantResolution={resolveTenantSlug(tenant)} />
}
