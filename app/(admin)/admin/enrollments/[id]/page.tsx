import { notFound } from "next/navigation"
import { EnrollmentDetailClient } from "@/components/admin/enrollments/EnrollmentDetailClient"

export const metadata = { title: "Détail inscription | KLASSCI" }

export default async function EnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) notFound()
  return <EnrollmentDetailClient enrollmentId={numId} />
}
