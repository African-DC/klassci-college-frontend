import { Badge } from "@/components/ui/badge"

export function BulletinStatusBadge({ isPublished }: { isPublished: boolean }) {
  if (isPublished) {
    return <Badge variant="default">Publié</Badge>
  }
  return <Badge variant="secondary">Brouillon</Badge>
}
