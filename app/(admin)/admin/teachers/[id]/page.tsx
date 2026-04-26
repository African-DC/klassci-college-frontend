import { notFound } from "next/navigation"
import { TeacherDetailClient } from "@/components/admin/teachers/TeacherDetailClient"

export const metadata = { title: "Fiche enseignant | KLASSCI" }

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) notFound()
  return <TeacherDetailClient teacherId={numId} />
}
