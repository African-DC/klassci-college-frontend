"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Building2, CreditCard, Database, ExternalLink, GraduationCap, Users, UserRound } from "lucide-react"
import { PageHero, heroGlassBtn } from "@/components/shared/PageHero"
import { KpiStrip } from "@/components/shared/list/KpiStrip"
import { useTenant } from "@/lib/hooks/super-admin/useTenants"
import { isSystemTenant, tenantUrl } from "@/lib/super-admin/tenant-display"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(1)} ${units[i]}`
}

export function TenantDetail({ slug }: { slug: string }) {
  const { data, isLoading, isError, error, refetch } = useTenant(slug)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Erreur de chargement</p>
        <p className="mt-1 text-muted-foreground">{(error as Error).message}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3">
          Réessayer
        </Button>
      </div>
    )
  }

  if (!data) return null

  const counts = data.counts

  return (
    <div className="space-y-5">
      <PageHero
        icon={Building2}
        title={data.school_settings?.school_name ?? data.slug}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono">{data.slug}</span>
            {isSystemTenant(data.slug) && (
              <Badge variant="secondary" className="border-white/20 bg-white/20 text-white">
                système
              </Badge>
            )}
            <span>Migration {data.alembic_head ?? "non renseignée"}</span>
          </span>
        }
        actions={
          <a href={tenantUrl(data.slug)} target="_blank" rel="noopener noreferrer" className={heroGlassBtn}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Ouvrir l'établissement
          </a>
        }
      />

      <KpiStrip
        items={[
          { label: "Utilisateurs", value: counts.users, icon: Users, tone: "primary" },
          { label: "Élèves", value: counts.students, icon: GraduationCap },
          { label: "Enseignants", value: counts.teachers, icon: UserRound },
          { label: "Personnel", value: counts.staff, icon: Users },
          { label: "Inscriptions", value: counts.enrollments, icon: Building2 },
          { label: "Paiements", value: counts.payments, icon: CreditCard, tone: "accent" },
        ]}
        columns={3}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" aria-hidden="true" />
            Paramètres de l'établissement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <Row label="Nom" value={data.school_settings?.school_name} />
            <Row label="Adresse" value={data.school_settings?.address} />
            <Row label="Téléphone" value={data.school_settings?.phone} />
            <Row label="Email" value={data.school_settings?.email} />
            <Row label="Code ministère" value={data.school_settings?.ministry_code} />
            <Row label="Taille DB" value={formatBytes(data.db_size_bytes)} />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1 border-b py-2 last:border-0 sm:grid-cols-3 sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium sm:col-span-2">
        {value || <span className="italic text-muted-foreground">non renseigné</span>}
      </dd>
    </div>
  )
}
