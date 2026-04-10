import { notFound } from "next/navigation"
import { ParentChildBulletinsClient } from "@/components/parent/ParentChildBulletinsClient"

export const metadata = { title: "Bulletins enfant | KLASSCI" }

export default async function ParentChildBulletinsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) notFound()
  return <ParentChildBulletinsClient childId={numId} />
}
