"use client"

import {
  CreditCard,
  GraduationCap,
  User,
  BookOpen,
  ClipboardCheck,
  Shield,
  Activity,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useDashboardActivity } from "@/lib/hooks/useDashboard"
import type { ActivityItem } from "@/lib/contracts/dashboard"

const entityConfig: Record<string, { icon: LucideIcon; variant: string }> = {
  payment: {
    icon: CreditCard,
    variant: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  enrollment: {
    icon: GraduationCap,
    variant: "bg-primary/10 text-primary",
  },
  student: {
    icon: User,
    variant: "bg-primary/10 text-primary",
  },
  evaluation: {
    icon: BookOpen,
    variant: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  grade: {
    icon: BookOpen,
    variant: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  attendance: {
    icon: ClipboardCheck,
    variant: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  user: {
    icon: Shield,
    variant: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
}

const defaultConfig = {
  icon: Activity,
  variant: "bg-muted text-muted-foreground",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Hier"
  return `Il y a ${days}j`
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const config = entityConfig[item.entity_type] ?? defaultConfig
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          config.variant
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">{item.description}</p>
        {item.user_name && (
          <p className="mt-1 text-xs text-muted-foreground truncate">
            par {item.user_name}
          </p>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {timeAgo(item.created_at)}
      </span>
    </div>
  )
}

export function RecentActivity() {
  const { data, isLoading } = useDashboardActivity()

  const items = data?.items ?? []

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune activité récente
          </p>
        )}
      </CardContent>
    </Card>
  )
}
