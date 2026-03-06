"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CalendarDays, ClipboardList, UserCheck, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Accueil", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "EDT", href: "/student/timetable", icon: CalendarDays },
  { label: "Notes", href: "/student/grades", icon: ClipboardList },
  { label: "Presences", href: "/student/attendance", icon: UserCheck },
  { label: "Frais", href: "/student/fees", icon: Wallet },
]

export function StudentNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[10px] font-medium transition-colors min-w-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              {item.label}
            </Link>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
