import type { Metadata } from "next"
import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Activity, Building2, KeyRound, ScrollText } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Super Admin · KLASSCI",
}

const NAV = [
  { href: "/super-admin/tenants" as Route, label: "Établissements", icon: Building2 },
  { href: "/super-admin/pats" as Route, label: "Tokens", icon: KeyRound },
  { href: "/super-admin/diagnose" as Route, label: "Diagnostic", icon: Activity },
  { href: "/super-admin/logs" as Route, label: "Journaux", icon: ScrollText },
]

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/super-admin/tenants")
  }
  if (session.user.role !== "super_admin") {
    redirect("/admin/dashboard")
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <Link href={"/super-admin/tenants" as Route} className="flex min-w-0 items-center gap-3">
              <div className="flex flex-col items-center w-fit">
                <Image src="/images/logo_klassci.png" alt="KLASSCI" width={90} height={24} priority />
                <span className="font-serif text-[9px] -mt-1.5 text-muted-foreground">College</span>
              </div>
              <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                Super Admin
              </span>
            </Link>
            <div className="truncate text-xs text-muted-foreground lg:hidden">{session.user.email}</div>
          </div>
          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:pb-0">
            {NAV.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:h-9"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="hidden text-sm text-muted-foreground lg:block">{session.user.email}</div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-8">{children}</main>
    </div>
  )
}
