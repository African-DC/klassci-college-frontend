import type { Metadata } from "next"
import { RetakesPageClient } from "@/components/admin/retakes/RetakesPageClient"

export const metadata: Metadata = {
  title: "Autorisations de reprise — KLASSCI",
  description: "Billets d'annulation de zéro pour les évaluations manquées",
}

export default function RetakesPage() {
  return <RetakesPageClient />
}
