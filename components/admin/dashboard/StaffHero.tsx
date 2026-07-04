"use client"

import { useSession } from "next-auth/react"
import { ClipboardCheck, GraduationCap, UserPlus, Wallet } from "lucide-react"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { useDashboardStats } from "@/lib/hooks/useDashboard"

/** Hero du tableau de bord du personnel — KPIs orientés secrétariat. */
export function StaffHero() {
  const { data: session } = useSession()
  const { data, isLoading } = useDashboardStats()

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const rawName = session?.user?.email?.split("@")[0] ?? "Personnel"
  const firstName = rawName.split(/[._]/)[0].replace(/^\w/, (c) => c.toUpperCase())
  const dash = (v: number | undefined) => (isLoading ? "—" : (v ?? 0))

  const kpis: HeroKpi[] = [
    {
      label: "Inscriptions à valider",
      value: dash(data?.enrollment_pending),
      icon: ClipboardCheck,
      hint: "Dossiers en attente",
    },
    {
      label: "Prospects à inscrire",
      value: dash(data?.enrollment_prospect),
      icon: UserPlus,
      hint: "À ouvrir",
    },
    {
      label: "Paiements en attente",
      value: dash(data?.pending_payments),
      icon: Wallet,
      hint: "À encaisser",
    },
    {
      label: "Élèves inscrits",
      value: dash(data?.enrolled_students),
      icon: GraduationCap,
      hint: data ? `${data.enrollment_validated ?? 0} validées` : undefined,
    },
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
