"use client"

import Link from "next/link"
import {
  Bell,
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
import {
  useMarkAllAsRead,
  useMarkAsRead,
  useMarkSeen,
  useNotificationCount,
  useNotifications,
} from "@/lib/hooks/useNotifications"
import type { Route } from "next"
import type { Notification } from "@/lib/contracts/notification"
import { cn } from "@/lib/utils"
import { idsAMarquerCommeVues, notificationTypeView } from "@/lib/notifications/type-view"

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
  const markSeen = useMarkSeen()

  const unreadCount = countData?.count ?? 0

  /**
   * A l'ouverture, ce qui est affiche passe en lu.
   *
   * Ce qui est affiche, et rien de plus : les alertes plus bas dans le
   * stock, et celles qui arriveront ensuite, restent a voir. Les effacer
   * ferait disparaitre des taches que personne n'a lues.
   */
  function handleOpenChange(ouvert: boolean) {
    if (!ouvert || !recent) return
    const aMarquer = idsAMarquerCommeVues(recent)
    if (aMarquer.length > 0) markSeen.mutate(aMarquer)
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
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
  const { Icon, tone } = notificationTypeView(notification.type)
  // Le serveur pose la destination : lui seul sait quelle action il attend.
  const lien = notification.action_url

  const contenu = (
    <div
      className={cn(
        "flex items-start gap-3 px-3 py-2.5 transition-colors",
        lien ? "hover:bg-muted" : "hover:bg-muted/50",
        !notification.read && "bg-primary/5",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          tone,
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

  // Sans destination, la notification reste une information : on ne
  // fabrique pas un lien vers une page ou il n'y a rien a faire.
  if (!lien) return contenu

  return (
    <Link href={lien as Route} className="block">
      {contenu}
    </Link>
  )
}
