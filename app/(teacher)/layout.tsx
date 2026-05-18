import { PortalShell } from "@/components/shared/PortalShell"
import { TeacherNav, TeacherSidebar } from "@/components/shared/TeacherNav"

// Auth-gated pages — voir commentaire dans (admin)/layout.tsx
export const dynamic = "force-dynamic"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PortalShell
      label="Enseignant"
      nav={<TeacherNav />}
      sidebar={<TeacherSidebar />}
    >
      {children}
    </PortalShell>
  )
}
