import type { Route } from "next"
import Link from "next/link"
import { Building2, Plus } from "lucide-react"
import { PageHero, heroAccentBtn } from "@/components/shared/PageHero"
import { TenantsTable } from "@/components/super-admin/tenants/TenantsTable"

export default function TenantsPage() {
  return (
    <div className="space-y-5">
      <PageHero
        icon={Building2}
        title="Établissements"
        subtitle="Provisioning, accès et suivi des bases tenant"
        actions={
          <Link href={"/super-admin/tenants/new" as Route} className={heroAccentBtn}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvel établissement
          </Link>
        }
      />
      <TenantsTable />
    </div>
  )
}
