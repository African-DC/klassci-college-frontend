"use client"

import { Settings } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataError } from "@/components/shared/DataError"
import { useSettings } from "@/lib/hooks/useSettings"
import { SchoolInfoSection } from "./SchoolInfoSection"
import { TrimesterSection } from "./TrimesterSection"
import { NotificationSection } from "./NotificationSection"

export function SettingsPageClient() {
  const { data: settings, isLoading, isError, refetch } = useSettings()

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Paramètres</h1>
          <p className="text-sm text-muted-foreground">
            Configuration de l&apos;établissement et des notifications
          </p>
        </div>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <SettingsSkeleton />
      ) : isError ? (
        <DataError message="Impossible de charger les paramètres." onRetry={() => refetch()} />
      ) : settings ? (
        <Tabs defaultValue="school" className="space-y-6">
          <TabsList>
            <TabsTrigger value="school">Établissement</TabsTrigger>
            <TabsTrigger value="trimesters">Trimestres</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="school">
            <SchoolInfoSection settings={settings} />
          </TabsContent>

          <TabsContent value="trimesters">
            <TrimesterSection settings={settings} />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSection settings={settings} />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-80" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-3/4" />
      </div>
    </div>
  )
}
