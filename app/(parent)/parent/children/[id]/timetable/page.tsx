import { notFound } from "next/navigation"
import { ChildTimetableClient } from "@/components/parent/ChildTimetableClient"

export const metadata = { title: "Emploi du temps | KLASSCI" }

export default async function ParentChildTimetablePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) notFound()
  return <ChildTimetableClient childId={numId} />
}
