"use client"

import Link from "next/link"
import type { Route } from "next"
import { FileText, Gavel, BarChart3, FileCheck2 } from "lucide-react"

interface ReportsNavLink {
  href: Route
  icon: typeof FileText
  label: string
}

const LINKS: ReportsNavLink[] = [
  { href: "/admin/reports" as Route, icon: FileText, label: "Bulletins" },
  { href: "/admin/reports/council" as Route, icon: Gavel, label: "Conseil de classe" },
  { href: "/admin/reports/dren" as Route, icon: BarChart3, label: "Statistiques DREN" },
  { href: "/admin/reports/deep" as Route, icon: FileCheck2, label: "Fin de trimestre" },
]

export function ReportsNav({ current }: { current: "bulletins" | "council" | "dren" | "deep" }) {
  const currentHref = current === "bulletins" ? "/admin/reports" : `/admin/reports/${current}`

  return (
    <nav aria-label="Types de rapports" className="flex flex-wrap gap-2">
      {LINKS.map(({ href, icon: Icon, label }) => {
        const isCurrent = href === currentHref
        if (isCurrent) {
          return (
            <span
              key={href}
              aria-current="page"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary bg-primary px-3.5 text-sm font-medium text-primary-foreground"
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {label}
            </span>
          )
        }
        return (
          <Link
            key={href}
            href={href}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
