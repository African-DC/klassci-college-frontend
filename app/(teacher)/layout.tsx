import { PortalShell } from "@/components/shared/PortalShell"
import { TeacherNav } from "@/components/shared/TeacherNav"

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
