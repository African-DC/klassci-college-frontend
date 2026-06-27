"use client"

import { useSession } from "next-auth/react"
import { GraduationCap, Wallet, CalendarDays, AlertTriangle } from "lucide-react"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { useDashboardStats } from "@/lib/hooks/useDashboard"

export function DashboardHero() {
  const { data: session } = useSession()
  const { data, isLoading } = useDashboardStats()

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const rawName = session?.user?.email?.split("@")[0] ?? "Administrateur"
  const firstName = rawName.split(/[._]/)[0].replace(/^\w/, (c) => c.toUpperCase())
  const dash = (v: number | undefined) => (isLoading ? "—" : (v ?? 0))

  const kpis: HeroKpi[] = [
    {
      label: "Élèves inscrits",
      value: dash(data?.enrolled_students),
      icon: GraduationCap,
      hint: data
        ? `${data.enrollment_validated ?? 0} validées · ${data.enrollment_pending ?? 0} en attente`
        : undefined,
    },
    { label: "Paiements en attente", value: dash(data?.pending_payments), icon: Wallet, hint: "À traiter" },
    { label: "Cours du jour", value: dash(data?.courses_today), icon: CalendarDays, hint: "Aujourd'hui" },
    { label: "Alertes", value: dash(data?.alerts), icon: AlertTriangle, hint: "Évaluations sans notes" },
  ]

  return (
    <PageHero
      title={`Bonjour, ${firstName}`}
      subtitle={
        <span className="capitalize" suppressHydrationWarning>
          {today}
        </span>
      }
      kpis={kpis}
    />
  )
}
