"use client"

import {
  UserPlus,
  CreditCard,
  ClipboardList,
  Bell,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/lib/hooks/useNotifications"
import type { Notification } from "@/lib/contracts/notification"

const typeConfig: Record<string, { icon: LucideIcon; variant: string }> = {
  enrollment_status: { icon: UserPlus, variant: "bg-primary/10 text-primary" },
  payment_due: { icon: CreditCard, variant: "bg-accent/10 text-accent" },
  payment_received: { icon: CreditCard, variant: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  grade_available: { icon: ClipboardList, variant: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  bulletin_published: { icon: ClipboardList, variant: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  absence_recorded: { icon: AlertTriangle, variant: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  system: { icon: Bell, variant: "bg-muted text-muted-foreground" },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

function ActivityItem({ notification }: { notification: Notification }) {
  const config = typeConfig[notification.type] ?? typeConfig.system
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", config.variant)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">{notification.title}</p>
        <p className="mt-1 text-xs text-muted-foreground truncate">{notification.body}</p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {timeAgo(notification.created_at)}
      </span>
    </div>
  )
}

export function RecentActivity() {
  const { data, isLoading } = useNotifications({ size: 5 })

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
        ) : data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((n) => (
              <ActivityItem key={n.id} notification={n} />
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
