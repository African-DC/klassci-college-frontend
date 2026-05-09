import type { Route } from "next"
import { redirect } from "next/navigation"

export default function SuperAdminIndex() {
  redirect("/super-admin/tenants" as Route)
}
