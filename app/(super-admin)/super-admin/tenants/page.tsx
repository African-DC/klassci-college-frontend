import type { Route } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TenantsTable } from "@/components/super-admin/tenants/TenantsTable"

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Liste des écoles provisionnées sur la plateforme.
          </p>
        </div>
        <Button asChild>
          <Link href={"/super-admin/tenants/new" as Route}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nouveau tenant
          </Link>
        </Button>
      </div>
      <TenantsTable />
    </div>
  )
}
