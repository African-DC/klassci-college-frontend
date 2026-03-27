import { ParentChildFeesClient } from "@/components/parent/ParentChildFeesClient"

export const metadata = { title: "Frais enfant | KLASSCI" }

export default async function ParentChildFeesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ParentChildFeesClient childId={Number(id)} />
}
