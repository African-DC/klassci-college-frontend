import { PortalShell } from "@/components/shared/PortalShell"
import { ParentNav } from "@/components/shared/ParentNav"

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PortalShell label="Parent" nav={<ParentNav />}>
      {children}
    </PortalShell>
  )
}
