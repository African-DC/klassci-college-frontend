"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Archive,
  ArrowUpFromLine,
  LayoutDashboard,
  UserPlus,
  GraduationCap,
  Users,
  UserCog,
  School,
  BookOpen,
  Layers,
  DoorOpen,
  Wallet,
  CreditCard,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  ClipboardList,
  HeartHandshake,
  UserCheck,
  FileText,
  Gauge,
  Bell,
  ScrollText,
  ShieldCheck,
  Settings,
  X,
  Banknote,
  ClipboardCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { filterAdminNavigation } from "@/lib/navigation/adminNav"

const ICONS = {
  Archive,
  Banknote,
  ClipboardCheck,
  ArrowUpFromLine,
  LayoutDashboard,
  UserPlus,
  GraduationCap,
  Users,
  UserCog,
  School,
  BookOpen,
  Layers,
  DoorOpen,
  Wallet,
  CreditCard,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  ClipboardList,
  HeartHandshake,
  UserCheck,
  FileText,
  Gauge,
  Bell,
  ScrollText,
  ShieldCheck,
  Settings,
} as const

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
            {section.items.map((item) => {
              const Icon = ICONS[item.iconName as keyof typeof ICONS]
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-accent before:content-['']"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {Icon ? <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} /> : null}
                  {item.label}
                </Link>
              )
            })}
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


