import { notFound } from "next/navigation"
import { StaffDetailClient } from "@/components/admin/staff/StaffDetailClient"

export const metadata = { title: "Fiche personnel | KLASSCI" }

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) notFound()
  return <StaffDetailClient staffId={numId} />
}
