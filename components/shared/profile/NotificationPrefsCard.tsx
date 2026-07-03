"use client"

import { Bell, Mail, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionTitle } from "@/components/shared/PageHero"
import { useNotificationPrefs, useUpdateNotificationPrefs } from "@/lib/hooks/useProfile"

function PrefRow({
  icon: Icon,
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onCheckedChange?: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/40 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function NotificationPrefsCard() {
  const { data: prefs, isLoading } = useNotificationPrefs()
  const { mutate: update, isPending } = useUpdateNotificationPrefs()

  return (
    <Card className="border shadow-sm rounded-xl">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <SectionTitle icon={Bell}>Préférences de notifications</SectionTitle>

        {isLoading || !prefs ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <PrefRow
              icon={Bell}
              title="Dans l'application"
              description="La cloche de notifications, toujours active."
              checked
              disabled
            />
            <PrefRow
              icon={Mail}
              title="Par email"
              description="Recevez aussi les notifications importantes par email."
              checked={prefs.email}
              disabled={isPending}
              onCheckedChange={(v) => update({ email: v })}
            />
            <PrefRow
              icon={MessageSquare}
              title="Par SMS"
              description="Recevez les alertes par SMS (nécessite un téléphone renseigné)."
              checked={prefs.sms}
              disabled={isPending}
              onCheckedChange={(v) => update({ sms: v })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
