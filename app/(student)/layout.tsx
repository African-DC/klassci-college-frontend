import { PortalShell } from "@/components/shared/PortalShell"
import { StudentNav } from "@/components/shared/StudentNav"

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
