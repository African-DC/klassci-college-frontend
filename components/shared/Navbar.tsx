"use client"

import Link from "next/link"
import type { Route } from "next"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { Menu, LogOut, User, ChevronDown, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMyProfile } from "@/lib/hooks/useProfile"
import { getUploadUrl } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/shared/NotificationBell"
import { AcademicYearBadge } from "@/components/shared/AcademicYearBadge"
import { logout } from "@/lib/utils/logout"
import { displayName, roleLabel } from "@/lib/utils/session-identity"

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const nom = displayName(session?.user)
  const initials = nom.slice(0, 2).toUpperCase()
  // La photo vient du profil, pas de la session : NextAuth ne porte que
  // l'identité, et la barre affichait donc les initiales même quand une
  // photo existait. Le cache de la requête est partagé avec la page
  // profil, donc changer sa photo met la barre à jour sans rechargement.
  const { data: profile } = useMyProfile()
  const photoSrc = getUploadUrl(profile?.photo_url)

  const role = session?.user?.role
  const profilePortal =
    role === "teacher" ? "teacher" : role === "student" ? "student" : role === "parent" ? "parent" : "admin"
  const profileHref = `/${profilePortal}/profile` as Route

  return (
    <header className="flex h-16 shrink-0 items-center border-b bg-card px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden mr-2"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title area — will be filled by pages later */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <AcademicYearBadge />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 text-muted-foreground rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 text-muted-foreground rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Changer le theme</span>
        </Button>

        {/* Notifications */}
        <NotificationBell />

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors outline-none">
              <Avatar className="h-8 w-8">
                {photoSrc ? (
                  <AvatarImage src={photoSrc} alt="" className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">{nom}</p>
                <p className="text-xs text-muted-foreground">{roleLabel(session?.user?.role)}</p>
              </div>
              <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={profileHref}>
                <User className="mr-2 h-4 w-4" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => void logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Deconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
