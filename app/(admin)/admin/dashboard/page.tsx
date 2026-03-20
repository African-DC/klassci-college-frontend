import { DashboardKpis } from "@/components/admin/dashboard/DashboardKpis"

export const metadata = { title: "Dashboard | KLASSCI" }

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de votre etablissement
        </p>
      </div>

      <DashboardKpis />
    </div>
  )
}
