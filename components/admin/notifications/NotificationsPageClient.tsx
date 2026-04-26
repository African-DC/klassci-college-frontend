"use client"

import { useState } from "react"
import {
  Bell,
  CreditCard,
  ClipboardList,
  FileText,
  AlertCircle,
  Settings,
  UserCheck,
  Check,
  CheckCheck,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataError } from "@/components/shared/DataError"
import {
  useNotifications,
  useNotificationCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/lib/hooks/useNotifications"
import type { Notification, NotificationType } from "@/lib/contracts/notification"
import { cn } from "@/lib/utils"

/** Icône par type de notification */
const TYPE_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  payment_due: CreditCard,
  payment_received: CreditCard,
  grade_available: ClipboardList,
  bulletin_published: FileText,
  absence_recorded: AlertCircle,
  enrollment_status: UserCheck,
  system: Settings,
}

/** Couleur de fond par type */
const TYPE_COLORS: Record<NotificationType, string> = {
  payment_due: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  payment_received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  grade_available: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  bulletin_published: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  absence_recorded: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  enrollment_status: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  system: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
}

/** Labels pour les types */
const TYPE_LABELS: Record<NotificationType, string> = {
  payment_due: "Paiement dû",
  payment_received: "Paiement reçu",
  grade_available: "Note disponible",
  bulletin_published: "Bulletin publié",
  absence_recorded: "Absence enregistrée",
  enrollment_status: "Inscription",
  system: "Système",
}

/** Formater une date relative */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days}j`
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const NOTIFICATION_TYPES: NotificationType[] = [
  "payment_due",
  "payment_received",
  "grade_available",
  "bulletin_published",
  "absence_recorded",
  "enrollment_status",
  "system",
]

export function NotificationsPageClient() {
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all")
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all")

  const params = {
    ...(typeFilter !== "all" && { type: typeFilter }),
    ...(readFilter === "unread" && { read: false }),
    ...(readFilter === "read" && { read: true }),
  }

  const { data: notifications, isLoading, isError, refetch } = useNotifications(params)
  const { data: countData } = useNotificationCount()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const unreadCount = countData?.count ?? 0

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                : "Toutes les notifications sont lues"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-3">
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as NotificationType | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {NOTIFICATION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={readFilter}
          onValueChange={(v) => setReadFilter(v as "all" | "unread" | "read")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="unread">Non lues</SelectItem>
            <SelectItem value="read">Lues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste */}
      {isLoading ? (
        <NotificationsSkeleton />
      ) : isError ? (
        <DataError
          message="Impossible de charger les notifications."
          onRetry={() => refetch()}
        />
      ) : !notifications || notifications.length === 0 ? (
        <div className="py-16 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Aucune notification.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkAsRead={() => markAsRead.mutate(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationRow({
  notification,
  onMarkAsRead,
}: {
  notification: Notification
  onMarkAsRead: () => void
}) {
  const Icon = TYPE_ICONS[notification.type]

  return (
    <Card
      className={cn(
        "border-0 shadow-sm ring-1 ring-border transition-colors",
        !notification.read && "ring-primary/30 bg-primary/[0.02]",
      )}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            TYPE_COLORS[notification.type],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn("text-sm", !notification.read && "font-semibold")}>
              {notification.title}
            </p>
            <Badge variant="secondary" className="text-[10px]">
              {TYPE_LABELS[notification.type]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{notification.body}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {timeAgo(notification.created_at)}
          </p>
        </div>

        {!notification.read && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={onMarkAsRead}
          >
            <Check className="mr-1 h-3 w-3" />
            Lire
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-lg" />
      ))}
    </div>
  )
}
