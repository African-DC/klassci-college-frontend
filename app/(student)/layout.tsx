import { PortalShell } from "@/components/shared/PortalShell"
import { StudentNav } from "@/components/shared/StudentNav"

// Auth-gated pages — voir commentaire dans (admin)/layout.tsx
export const dynamic = "force-dynamic"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PortalShell label="Eleve" nav={<StudentNav />}>
      {children}
    </PortalShell>
  )
}
