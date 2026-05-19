import { notFound } from "next/navigation"
import { ParentDetailClient } from "@/components/admin/parents/ParentDetailClient"

export const metadata = { title: "Fiche parent | KLASSCI" }

export default async function ParentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) notFound()
  return <ParentDetailClient parentId={numId} />
}
