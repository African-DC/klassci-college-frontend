"use client"

import Link from "next/link"
import { ArrowRight, Settings, Shield } from "lucide-react"
import { PageHero } from "@/components/shared/PageHero"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataError } from "@/components/shared/DataError"
import { useSettings } from "@/lib/hooks/useSettings"
import { SchoolInfoSection } from "./SchoolInfoSection"
import { TrimesterSection } from "./TrimesterSection"
import { NotificationSection } from "./NotificationSection"
import { PdfIdentitySection } from "./PdfIdentitySection"

export function SettingsPageClient() {
  const { data: settings, isLoading, isError, refetch } = useSettings()

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <PageHero
        icon={Settings}
        title="Paramètres"
        subtitle="Configuration de l'établissement et des notifications"
      />

      {/* Contenu */}
      {isLoading ? (
        <SettingsSkeleton />
      ) : isError ? (
        <DataError message="Impossible de charger les paramètres." onRetry={() => refetch()} />
      ) : settings ? (
        <Tabs defaultValue="school" className="space-y-6">
          <TabsList>
            <TabsTrigger value="school">Établissement</TabsTrigger>
            <TabsTrigger value="identity">Identité visuelle</TabsTrigger>
            <TabsTrigger value="trimesters">Trimestres</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="school">
            <SchoolInfoSection settings={settings} />
          </TabsContent>

          <TabsContent value="identity">
            <PdfIdentitySection settings={settings} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="trimesters">
            <TrimesterSection settings={settings} />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSection settings={settings} />
          </TabsContent>
        </Tabs>
      ) : null}

      {/* Discoverability link to roles & permissions */}
      <Link
        href="/admin/roles"
        aria-label="Accéder à la gestion des rôles et permissions"
        className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Shield aria-hidden="true" className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Rôles &amp; permissions</p>
          <p className="text-sm text-muted-foreground">
            Configurez qui peut faire quoi dans votre établissement (créer des
            évaluations, valider les paiements, gérer les inscriptions…).
          </p>
        </div>
        <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
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
