"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { useTenant } from "@/lib/hooks/super-admin/useTenants"

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
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm">
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
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {data.school_settings?.school_name ?? data.slug}
          </h1>
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {data.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>
            Slug : <span className="font-mono">{data.slug}</span>
          </p>
          <p>
            Migration : <span className="font-mono">{data.alembic_head ?? "—"}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Utilisateurs" value={counts.users} />
        <Stat label="Élèves" value={counts.students} />
        <Stat label="Enseignants" value={counts.teachers} />
        <Stat label="Personnel" value={counts.staff} />
        <Stat label="Inscriptions" value={counts.enrollments} />
        <Stat label="Paiements" value={counts.payments} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paramètres de l'établissement</CardTitle>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b py-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium">
        {value || <span className="italic text-muted-foreground">non renseigné</span>}
      </dd>
    </div>
  )
}
