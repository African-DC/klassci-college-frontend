import { Badge } from "@/components/ui/badge"
import type { BulletinStatus } from "@/lib/contracts/bulletin"

const statusConfig: Record<BulletinStatus, { label: string; variant: "default" | "secondary" }> = {
  brouillon: { label: "Brouillon", variant: "secondary" },
  publie: { label: "Publié", variant: "default" },
}

export function BulletinStatusBadge({ status }: { status: BulletinStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
