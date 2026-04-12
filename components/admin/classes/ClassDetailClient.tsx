"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Pencil, Trash2, Users, School, DoorOpen } from "lucide-react"
import { useClass, useDeleteClass } from "@/lib/hooks/useClasses"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataError } from "@/components/shared/DataError"
import { ClassEditModal } from "./ClassEditModal"
import { useState } from "react"

interface ClassDetailClientProps {
  classId: number
}

export function ClassDetailClient({ classId }: ClassDetailClientProps) {
  const router = useRouter()
  const { data: classData, isLoading, isError, error, refetch } = useClass(classId)
  const deleteMutation = useDeleteClass()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !classData) {
    return <DataError message={error?.message ?? "Classe introuvable"} error={error} onRetry={refetch} />
  }

  const enrolled = classData.enrolled_count ?? 0
  const max = classData.max_students ?? 0
  const ratio = max > 0 ? Math.round((enrolled / max) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/classes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{classData.name}</h1>
            <p className="text-sm text-muted-foreground">
              {classData.level_name}
              {classData.series_name && ` — Série ${classData.series_name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Élèves inscrits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolled}</div>
            <p className="text-xs text-muted-foreground">sur {max || "—"} places</p>
            {max > 0 && (
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    ratio > 95 ? "bg-rose-500" : ratio >= 80 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(ratio, 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Niveau</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classData.level_name ?? "—"}</div>
            {classData.series_name && (
              <p className="text-xs text-muted-foreground">Série {classData.series_name}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de remplissage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ratio}%</div>
            <p className="text-xs text-muted-foreground">
              {max > 0 ? `${max - enrolled} places disponibles` : "Capacité non définie"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Salle</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classData.room_id ? `Salle #${classData.room_id}` : "—"}</div>
            <p className="text-xs text-muted-foreground">
              {classData.room_id ? "Salle assignée" : "Aucune salle assignée"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ClassEditModal classId={editOpen ? classId : null} open={editOpen} onClose={() => setEditOpen(false)} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la classe</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La classe "{classData.name}" sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                deleteMutation.mutate(classId, {
                  onSuccess: () => router.push("/admin/classes"),
                })
              }}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
