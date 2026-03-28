import { notFound } from "next/navigation"
import { ParentChildGradesClient } from "@/components/parent/ParentChildGradesClient"

export const metadata = { title: "Notes enfant | KLASSCI" }

export default async function ParentChildGradesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) notFound()
  return <ParentChildGradesClient childId={numId} />
}
