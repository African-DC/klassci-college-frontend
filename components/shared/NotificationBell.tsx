"use client"

import Link from "next/link"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotificationCount, useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/lib/hooks/useNotifications"
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

/** Formater une date relative simple */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days}j`
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export function NotificationBell() {
  const { data: countData } = useNotificationCount()
  const { data: recent } = useNotifications({ size: 5 })
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const unreadCount = countData?.count ?? 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs text-muted-foreground"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Tout lire
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {!recent || recent.length === 0 ? (
          <div className="py-6 text-center">
            <Bell className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">Aucune notification</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {recent.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => markAsRead.mutate(notification.id)}
              />
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/admin/notifications"
            className="flex items-center justify-center text-xs text-primary font-medium"
          >
            Voir toutes les notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification
  onMarkAsRead: () => void
}) {
  const Icon = TYPE_ICONS[notification.type]

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors",
        !notification.read && "bg-primary/5",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          TYPE_COLORS[notification.type],
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs leading-snug", !notification.read && "font-semibold")}>
          {notification.title}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {notification.body}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
          {timeAgo(notification.created_at)}
        </p>
      </div>
      {!notification.read && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onMarkAsRead()
          }}
        >
          <Check className="h-3 w-3 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}
