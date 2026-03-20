"use client"

import Link from "next/link"
import {
  UserPlus,
  ClipboardList,
  CalendarDays,
  FileText,
  CreditCard,
  UserCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const actions = [
  {
    label: "Nouvelle inscription",
    href: "/admin/enrollments",
    icon: UserPlus,
    color: "text-primary bg-primary/10",
  },
  {
    label: "Saisir des notes",
    href: "/admin/grades",
    icon: ClipboardList,
    color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    label: "Emploi du temps",
    href: "/admin/timetable",
    icon: CalendarDays,
    color: "text-violet-600 bg-violet-500/10 dark:text-violet-400",
  },
  {
    label: "Bulletins",
    href: "/admin/reports",
    icon: FileText,
    color: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
  },
  {
    label: "Paiements",
    href: "/admin/payments",
    icon: CreditCard,
    color: "text-accent bg-accent/10",
  },
  {
    label: "Presences",
    href: "/admin/attendance",
    icon: UserCheck,
    color: "text-sky-600 bg-sky-500/10 dark:text-sky-400",
  },
]

export function QuickActions() {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href as never}
              className="flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-colors hover:bg-muted"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
