import type { Metadata } from "next"
import { SummonsPageClient } from "@/components/admin/summons/SummonsPageClient"

export const metadata: Metadata = {
  title: "Convocations de parent — KLASSCI",
  description: "Registre des convocations de tuteurs et de la suite donnée",
}

export default function SummonsPage() {
  return <SummonsPageClient />
}
