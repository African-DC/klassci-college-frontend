"use client"

import { ArrowLeft, FileText, Award } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useParentChildBulletins } from "@/lib/hooks/useParentPortal"

interface ParentChildBulletinsClientProps {
  childId: number
}

export function ParentChildBulletinsClient({ childId }: ParentChildBulletinsClientProps) {
  const { data, isLoading, error, refetch } = useParentChildBulletins(childId)

  if (error) {
    return <DataError message="Impossible de charger les bulletins." onRetry={refetch} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/parent/children"
          className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-tight">Bulletins</h1>
            <p className="text-sm text-muted-foreground">Bulletins trimestriels de votre enfant</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : data && data.bulletins.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.bulletins.map((bulletin) => (
            <Card key={bulletin.id} className="border-0 shadow-sm ring-1 ring-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Trimestre {bulletin.trimester}</CardTitle>
                  <Badge variant={bulletin.is_published ? "default" : "secondary"}>
                    {bulletin.is_published ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {bulletin.class_name} — {bulletin.academic_year_name}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Moyenne</p>
                    <p className="text-lg font-semibold">
                      {bulletin.average !== null ? `${bulletin.average.toFixed(2)}/20` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rang</p>
                    <p className="text-lg font-semibold">
                      {bulletin.rank !== null ? `${bulletin.rank}e` : "—"}
                    </p>
                  </div>
                </div>
                {bulletin.mention && (
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">{bulletin.mention}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">Aucun bulletin disponible.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
