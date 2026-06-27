"use client"

import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, CalendarDays, ClipboardList, UserCheck, LogOut, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems: { label: string; href: Route; icon: LucideIcon }[] = [
  { label: "Accueil", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "Mon EDT", href: "/teacher/timetable", icon: CalendarDays },
  { label: "Notes", href: "/teacher/grades" as Route, icon: ClipboardList },
  { label: "Appel", href: "/teacher/attendance" as Route, icon: UserCheck },
]

export function TeacherNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[10px] font-medium transition-colors min-w-[56px]",
                isActive
                  ? "text-primary before:absolute before:top-0 before:left-1/2 before:h-1 before:w-6 before:-translate-x-1/2 before:rounded-full before:bg-accent before:content-['']"
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

export function TeacherSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-60 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex flex-col items-center w-fit">
          <Image
            src="/images/logo_klassci.png"
            alt="KLASSCI"
            width={110}
            height={30}
            priority
          />
          <span className="font-serif text-[10px] -mt-1.5 text-muted-foreground">
            College
          </span>
        </div>
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
          Enseignant
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-accent before:content-['']"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Deconnexion
        </button>
      </div>
    </aside>
  )
}
