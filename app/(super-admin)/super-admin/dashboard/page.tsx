import type { Route } from "next"
import { redirect } from "next/navigation"

export default function SuperAdminDashboard() {
  redirect("/super-admin/tenants" as Route)
}
