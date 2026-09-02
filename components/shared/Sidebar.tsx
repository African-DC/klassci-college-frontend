"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { filterAdminNavigation } from "@/lib/navigation/adminNav"
import { SidebarNavItem } from "@/components/shared/SidebarNavItem"


interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { permissions, isLoading } = usePermissions()
  const navigation = isLoading ? [] : filterAdminNavigation(permissions)

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex flex-col items-center w-fit">
          <Image
            src="/images/logo_klassci.png"
            alt="KLASSCI"
            width={120}
            height={32}
          />
          <span className="font-serif text-[12px] -mt-2 text-muted-foreground">
            College
          </span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Separator />

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {isLoading && (
          <p className="px-3 text-sm text-muted-foreground">Chargement du menu...</p>
        )}
        {!isLoading && navigation.length === 0 && (
          <p className="px-3 text-sm text-muted-foreground">Aucun menu disponible pour ce rôle.</p>
        )}
        {navigation.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            {section.items.map((item) => (
              <SidebarNavItem
                key={"href" in item ? item.href : item.label}
                item={item}
                pathname={pathname}
                onNavigate={onClose}
              />
            ))}
          </div>
        ))}
      </nav>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col lg:border-r lg:bg-card">
        {content}
      </aside>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-card shadow-xl lg:hidden animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </>
      )}
    </>
  )
}


