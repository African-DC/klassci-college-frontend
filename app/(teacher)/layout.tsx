import { PortalShell } from "@/components/shared/PortalShell"
import { TeacherNav } from "@/components/shared/TeacherNav"

// Auth-gated pages — voir commentaire dans (admin)/layout.tsx
export const dynamic = "force-dynamic"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PortalShell label="Enseignant" nav={<TeacherNav />}>
      {children}
    </PortalShell>
  )
}
