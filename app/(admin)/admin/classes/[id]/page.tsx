import { ClassDetailClient } from "@/components/admin/classes/ClassDetailClient"

interface ClassDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { id } = await params
  return <ClassDetailClient classId={Number(id)} />
}
