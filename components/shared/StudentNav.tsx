"use client"

import type { Route } from "next"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Wallet,
  MoreHorizontal,
  FileText,
  UserCheck,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

const mainNavItems = [
  { label: "Accueil", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "EDT", href: "/student/timetable", icon: CalendarDays },
  { label: "Notes", href: "/student/grades", icon: ClipboardList },
  { label: "Frais", href: "/student/fees", icon: Wallet },
]

const moreNavItems = [
  { label: "Bulletins", href: "/student/bulletins", icon: FileText },
  { label: "Présences", href: "/student/attendance", icon: UserCheck },
]

export function StudentNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermeture du menu par Escape
  useEffect(() => {
    if (!moreOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [moreOpen])

  // Le menu "Plus" est actif si on est sur une page secondaire
  const isMoreActive = moreNavItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  )

  return (
    <>
      {/* Menu déroulant "Plus" */}
      {moreOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMoreOpen(false)}
          />
          {/* Popup */}
          <div ref={menuRef} role="menu" className="fixed bottom-16 right-2 z-50 rounded-lg border bg-card p-2 shadow-lg min-w-[160px]">
            {moreNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                    isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
            <button
              role="menuitem"
              onClick={() => {
                setMoreOpen(false)
                signOut({ callbackUrl: "/login" })
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </>
      )}

      {/* Barre de navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center justify-around px-2 py-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[10px] font-medium transition-colors min-w-[56px]",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {item.label}
              </Link>
            )
          })}
          <button
            aria-expanded={moreOpen}
            aria-haspopup="true"
            onClick={() => setMoreOpen((prev) => !prev)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[10px] font-medium transition-colors min-w-[56px]",
              isMoreActive || moreOpen ? "text-primary" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className={cn("h-5 w-5", (isMoreActive || moreOpen) && "text-primary")} />
            Plus
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  )
}
