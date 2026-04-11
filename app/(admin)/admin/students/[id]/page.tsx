import { notFound } from "next/navigation"
import { StudentDetailClient } from "@/components/admin/students/StudentDetailClient"

export const metadata = { title: "Fiche élève | KLASSCI" }

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) notFound()
  return <StudentDetailClient studentId={numId} />
}
