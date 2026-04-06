import { notFound } from "next/navigation"
import { ParentChildFeesClient } from "@/components/parent/ParentChildFeesClient"

export const metadata = { title: "Frais enfant | KLASSCI" }

export default async function ParentChildFeesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) notFound()
  return <ParentChildFeesClient childId={numId} />
}
