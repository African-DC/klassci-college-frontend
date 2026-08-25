"use client"

import type { Route } from "next"
import Link from "next/link"
import {
  CalendarClock,
  CreditCard,
  School,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const actions: { label: string; href: Route; icon: LucideIcon }[] = [
  { label: "Nouvelle inscription", href: "/admin/enrollments?action=create" as Route, icon: UserPlus },
  { label: "Encaisser un paiement", href: "/admin/payments", icon: CreditCard },
  { label: "Présences", href: "/admin/attendance", icon: UserCheck },
  { label: "Élèves", href: "/admin/students", icon: Users },
  { label: "Classes", href: "/admin/classes", icon: School },
  { label: "Mes congés", href: "/admin/profile" as Route, icon: CalendarClock },
]

/** Actions rapides du personnel (secrétariat) — inscriptions, caisse, présences. */
export function StaffQuickActions() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-2 rounded-lg border border-transparent p-4 text-center transition-colors hover:border-border hover:bg-muted"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <action.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
