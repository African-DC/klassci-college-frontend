import { PortalShell } from "@/components/shared/PortalShell"
import { ParentNav } from "@/components/shared/ParentNav"

// Auth-gated pages — voir commentaire dans (admin)/layout.tsx
export const dynamic = "force-dynamic"

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
