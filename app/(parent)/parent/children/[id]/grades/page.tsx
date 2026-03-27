import { ParentChildGradesClient } from "@/components/parent/ParentChildGradesClient"

export const metadata = { title: "Notes enfant | KLASSCI" }

export default async function ParentChildGradesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ParentChildGradesClient childId={Number(id)} />
}
