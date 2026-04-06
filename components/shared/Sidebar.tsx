"use client"

import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  UserPlus,
  GraduationCap,
  Users,
  UserCog,
  School,
  BookOpen,
  Wallet,
  CreditCard,
  CalendarDays,
  ClipboardList,
  UserCheck,
  FileText,
  Bell,
  ShieldCheck,
  Settings,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

interface NavItem {
  label: string
  href: Route
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Scolarite",
    items: [
      { label: "Inscriptions", href: "/admin/enrollments", icon: UserPlus },
      { label: "Eleves", href: "/admin/students", icon: GraduationCap },
      { label: "Enseignants", href: "/admin/teachers", icon: Users },
      { label: "Personnel", href: "/admin/staff", icon: UserCog },
    ],
  },
  {
    title: "Academique",
    items: [
      { label: "Classes", href: "/admin/classes", icon: School },
      { label: "Matieres", href: "/admin/subjects", icon: BookOpen },
    ],
  },
  {
    title: "Finances",
    items: [
      { label: "Frais", href: "/admin/fees", icon: Wallet },
      { label: "Paiements", href: "/admin/payments", icon: CreditCard },
    ],
  },
  {
    title: "Suivi",
    items: [
      { label: "Emploi du temps", href: "/admin/timetable", icon: CalendarDays },
      { label: "Notes", href: "/admin/grades", icon: ClipboardList },
      { label: "Presences", href: "/admin/attendance", icon: UserCheck },
      { label: "Bulletins", href: "/admin/reports", icon: FileText },
    ],
  },
  {
    title: "Systeme",
    items: [
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck },
      { label: "Parametres", href: "/admin/settings" as Route, icon: Settings },
    ],
  },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  const content = (
    <div className="flex h-full flex-col">
      {/* Header */}
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
        {/* Mobile close button */}
        {onClose && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigation.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col lg:border-r lg:bg-card">
        {content}
      </aside>

      {/* Mobile sidebar (sheet-like overlay) */}
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
