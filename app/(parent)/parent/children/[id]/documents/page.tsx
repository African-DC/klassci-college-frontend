import { notFound } from "next/navigation"
import { ParentChildDocumentsClient } from "@/components/parent/ParentChildDocumentsClient"

export const metadata = { title: "Documents | KLASSCI" }

export default async function ParentChildDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) notFound()
  return <ParentChildDocumentsClient childId={numId} />
}
