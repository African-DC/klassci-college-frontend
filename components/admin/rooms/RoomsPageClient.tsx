"use client"

import { useMemo, useState } from "react"
import {
  DoorOpen,
  Plus,
  School,
  FlaskConical,
  Monitor,
  BookOpen,
  Search,
  Pencil,
  Trash2,
  Users,
  AlertTriangle,
  Wand2,
} from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useRooms, useDeleteRoom } from "@/lib/hooks/useRooms"
import { useClasses } from "@/lib/hooks/useClasses"
import { batchCreateRooms } from "@/lib/api/rooms"
import type { Room } from "@/lib/contracts/room"
import { ROOM_TYPES } from "@/lib/contracts/room"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { RoomCreateModal } from "./RoomCreateModal"
import { RoomEditModal } from "./RoomEditModal"
import { useDebounce } from "@/lib/hooks/useDebounce"

const typeIcons: Record<string, typeof School> = {
  classroom: School,
  laboratory: FlaskConical,
  computer_room: Monitor,
  library: BookOpen,
  other: DoorOpen,
}

const typeColors: Record<string, string> = {
  classroom: "bg-primary/10 text-primary",
  laboratory: "bg-amber-500/10 text-amber-600",
  computer_room: "bg-violet-500/10 text-violet-600",
  library: "bg-emerald-500/10 text-emerald-600",
  other: "bg-muted text-muted-foreground",
}

function getRoomTypeLabel(type: string) {
  return ROOM_TYPES.find((t) => t.value === type)?.label ?? type
}

export function RoomsPageClient() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const debouncedSearch = useDebounce(search)

  const params = useMemo(() => ({
    size: 100,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(typeFilter !== "all" && { room_type: typeFilter }),
  }), [debouncedSearch, typeFilter])

  const { data, isLoading, isError, error, refetch } = useRooms(params)
  const { data: classesData } = useClasses({ size: 100 })
  const deleteMutation = useDeleteRoom()
  const rooms = data?.items ?? []
  const allClasses = classesData?.items ?? []

  // Classes without a room
  const classesWithoutRoom = useMemo(() => {
    const roomClassIds = new Set(rooms.filter((r) => r.class_id).map((r) => r.class_id))
    return allClasses.filter((c) => !c.room_id && !roomClassIds.has(c.id))
  }, [allClasses, rooms])

  // Batch create mutation
  const batchMutation = useMutation({
    mutationFn: batchCreateRooms,
    onSuccess: (result) => {
      toast.success(`${result.created} salle${result.created > 1 ? "s" : ""} créée${result.created > 1 ? "s" : ""}`)
      queryClient.invalidateQueries({ queryKey: ["rooms"] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
    onError: (err: Error) => {
      toast.error("Erreur", { description: err.message })
    },
  })

  // Group by type for summary
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const room of rooms) {
      counts[room.room_type] = (counts[room.room_type] || 0) + 1
    }
    return counts
  }, [rooms])

  if (isError) {
    return <DataError message={error?.message ?? "Impossible de charger les salles"} error={error} onRetry={refetch} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <DoorOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Salles</h1>
            <p className="text-sm text-muted-foreground">
              {rooms.length} salle{rooms.length !== 1 ? "s" : ""} configurée{rooms.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle salle
        </Button>
      </div>

      {/* Classes without room — banner */}
      {classesWithoutRoom.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">
                  {classesWithoutRoom.length} classe{classesWithoutRoom.length > 1 ? "s" : ""} sans salle assignée
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {classesWithoutRoom.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                    >
                      <School className="h-3 w-3" />
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0 gap-2"
              disabled={batchMutation.isPending}
              onClick={() => batchMutation.mutate()}
            >
              <Wand2 className="h-4 w-4" />
              {batchMutation.isPending
                ? "Création..."
                : `Créer ${classesWithoutRoom.length} salle${classesWithoutRoom.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}

      {/* Type summary chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            typeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
          onClick={() => setTypeFilter("all")}
        >
          Toutes ({rooms.length})
        </button>
        {ROOM_TYPES.map((t) => {
          const count = typeCounts[t.value] ?? 0
          if (count === 0 && typeFilter !== t.value) return null
          const Icon = typeIcons[t.value] ?? DoorOpen
          return (
            <button
              key={t.value}
              type="button"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === t.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
              onClick={() => setTypeFilter(typeFilter === t.value ? "all" : t.value)}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une salle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          {search || typeFilter !== "all"
            ? "Aucune salle ne correspond aux filtres"
            : "Aucune salle configurée"}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={() => setEditId(room.id)}
              onDelete={() => setDeleteTarget({ id: room.id, name: room.name })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <RoomCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <RoomEditModal roomId={editId} open={editId !== null} onClose={() => setEditId(null)} />

      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la salle</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La salle "{deleteTarget?.name}" sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  })
                }
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

function RoomCard({
  room,
  onEdit,
  onDelete,
}: {
  room: Room
  onEdit: () => void
  onDelete: () => void
}) {
  const Icon = typeIcons[room.room_type] ?? DoorOpen
  const colorClass = typeColors[room.room_type] ?? typeColors.other

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Icon + Type */}
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-base mb-1">{room.name}</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {getRoomTypeLabel(room.room_type)}
        </p>

        {/* Capacity + Class */}
        <div className="flex items-center justify-between">
          {room.capacity ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{room.capacity} places</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Capacité non définie</span>
          )}
          {room.class_name ? (
            <Badge variant="outline" className="text-xs">
              {room.class_name}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs text-muted-foreground">
              Non assignée
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
