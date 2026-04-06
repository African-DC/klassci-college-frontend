"use client"

import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, CalendarDays, ClipboardList, UserCheck, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Accueil", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "Mon EDT", href: "/teacher/timetable", icon: CalendarDays },
  { label: "Notes", href: "/teacher/grades", icon: ClipboardList },
  { label: "Appel", href: "/teacher/attendance", icon: UserCheck },
]

export function TeacherNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href as Route}
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
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[10px] font-medium text-muted-foreground transition-colors min-w-[56px] hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          Quitter
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
