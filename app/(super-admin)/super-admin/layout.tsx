import type { Metadata } from "next"
import type { Route } from "next"
import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Super Admin · KLASSCI",
}

const NAV: { href: Route; label: string }[] = [
  { href: "/super-admin/tenants" as Route, label: "Tenants" },
  { href: "/super-admin/pats" as Route, label: "Tokens" },
  { href: "/super-admin/diagnose" as Route, label: "Diagnose" },
  { href: "/super-admin/logs" as Route, label: "Logs" },
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href={"/super-admin/tenants" as Route} className="text-lg font-semibold tracking-tight">
              KLASSCI
              <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                Super Admin
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="text-sm text-muted-foreground">{session.user.email}</div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
